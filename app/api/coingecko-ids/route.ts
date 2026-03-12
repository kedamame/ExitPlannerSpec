import { NextRequest, NextResponse } from 'next/server'

/**
 * Resolves contract addresses → CoinGecko ID + current USD price.
 * Uses /coins/list?include_platform=true to build an address→id map (cached 1h),
 * then fetches prices via /simple/price.
 */

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

// address → coinId cache (long TTL — coin list rarely changes)
let coinListCache: Map<string, string> | null = null
let coinListTs = 0
const COIN_LIST_TTL = 3600000 // 1h

// price cache
const priceCache = new Map<string, { usd: number; ts: number }>()
const PRICE_TTL = 30000 // 30s

const PLATFORMS = ['ethereum', 'base', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'optimistic-ethereum']

async function getCoinList(headers: HeadersInit): Promise<Map<string, string>> {
  if (coinListCache && Date.now() - coinListTs < COIN_LIST_TTL) return coinListCache

  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/list?include_platform=true',
    { headers }
  )
  if (!res.ok) return coinListCache ?? new Map()

  const list: Array<{ id: string; platforms?: Record<string, string> }> = await res.json()
  const map = new Map<string, string>()
  for (const coin of list) {
    if (!coin.platforms) continue
    for (const platform of PLATFORMS) {
      const addr = coin.platforms[platform]
      if (addr) map.set(addr.toLowerCase(), coin.id)
    }
  }
  coinListCache = map
  coinListTs = Date.now()
  return map
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('addresses') ?? ''
  const addresses = raw
    .split(',')
    .filter(Boolean)
    .filter((a) => ADDRESS_RE.test(a))
    .map((a) => a.toLowerCase())
    .slice(0, 50)

  if (addresses.length === 0) return NextResponse.json({})

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    const coinList = await getCoinList(headers)

    // Map address → coinId
    const addrToId: Record<string, string> = {}
    for (const addr of addresses) {
      const id = coinList.get(addr)
      if (id) addrToId[addr] = id
    }

    // Fetch prices for resolved IDs
    const now = Date.now()
    const ids = [...new Set(Object.values(addrToId))]
    const needFetch = ids.filter((id) => {
      const c = priceCache.get(id)
      return !c || now - c.ts > PRICE_TTL
    })

    if (needFetch.length > 0) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${needFetch.join(',')}&vs_currencies=usd`,
        { headers }
      )
      if (res.ok) {
        const data: Record<string, { usd: number }> = await res.json()
        for (const id of needFetch) {
          if (data[id]?.usd) priceCache.set(id, { usd: data[id].usd, ts: now })
        }
      }
    }

    // Build result: address → { id, usd }
    const result: Record<string, { id: string; usd: number }> = {}
    for (const addr of addresses) {
      const id = addrToId[addr]
      if (!id) continue
      const priceEntry = priceCache.get(id)
      result[addr] = { id, usd: priceEntry?.usd ?? 0 }
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
