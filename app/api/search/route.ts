import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 30000
const CONTRACT_RE = /^0x[0-9a-fA-F]{40}$/
// CoinGecko platform IDs to try for contract address lookups
const EVM_PLATFORMS = ['ethereum', 'base', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'optimistic-ethereum']

async function lookupByContract(address: string, headers: HeadersInit) {
  for (const platform of EVM_PLATFORMS) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address.toLowerCase()}`,
        { headers }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          return [{
            id: data.id,
            name: data.name,
            symbol: (data.symbol ?? '').toUpperCase(),
            thumb: data.image?.thumb ?? '',
            platform,
          }]
        }
      }
    } catch {
      // try next platform
    }
  }
  return []
}

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (!query) return NextResponse.json({ coins: [] })

  const cacheKey = query.toLowerCase()
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ coins: cached.data })
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    let coins: unknown[]

    if (CONTRACT_RE.test(query)) {
      // Contract address lookup
      coins = await lookupByContract(query, headers)
    } else {
      // Ticker / name search
      const res = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
        { headers }
      )
      if (!res.ok) return NextResponse.json({ coins: [] }, { status: res.status })
      const data = await res.json()
      coins = data.coins?.slice(0, 10) ?? []
    }

    cache.set(cacheKey, { data: coins, ts: now })
    return NextResponse.json({ coins })
  } catch {
    return NextResponse.json({ coins: [] }, { status: 500 })
  }
}
