import { NextRequest, NextResponse } from 'next/server'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const cache = new Map<string, { data: TokenMeta[]; ts: number }>()
const CACHE_TTL = 60000 // 1 min

export interface TokenMeta {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
}

async function fetchTokenTx(apiUrl: string, address: string, apiKey?: string): Promise<TokenMeta[]> {
  const key = apiKey ?? ''
  const url = `${apiUrl}?module=account&action=tokentx&address=${address}&sort=desc&offset=200&page=1${key ? `&apikey=${key}` : ''}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  if (data.status !== '1' || !Array.isArray(data.result)) return []

  // Deduplicate by contractAddress, keep most recent entry
  const seen = new Map<string, TokenMeta>()
  for (const tx of data.result as Array<{
    contractAddress: string
    tokenSymbol: string
    tokenName: string
    tokenDecimal: string
  }>) {
    const addr = tx.contractAddress.toLowerCase()
    if (!seen.has(addr)) {
      seen.set(addr, {
        contractAddress: addr,
        symbol: tx.tokenSymbol,
        name: tx.tokenName,
        decimals: parseInt(tx.tokenDecimal, 10) || 18,
      })
    }
  }
  return Array.from(seen.values())
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address') ?? ''
  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: 'invalid address' }, { status: 400 })
  }

  const cacheKey = address.toLowerCase()
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ tokens: cached.data })
  }

  const ethKey = process.env.ETHERSCAN_API_KEY
  const baseKey = process.env.BASESCAN_API_KEY ?? ethKey

  try {
    // Fetch from Ethereum and Base in parallel
    const [ethTokens, baseTokens] = await Promise.allSettled([
      fetchTokenTx('https://api.etherscan.io/api', address, ethKey),
      fetchTokenTx('https://api.basescan.org/api', address, baseKey),
    ])

    const all = new Map<string, TokenMeta>()
    if (ethTokens.status === 'fulfilled') {
      for (const t of ethTokens.value) all.set(t.contractAddress, t)
    }
    if (baseTokens.status === 'fulfilled') {
      for (const t of baseTokens.value) all.set(t.contractAddress, t)
    }

    const tokens = Array.from(all.values())
    cache.set(cacheKey, { data: tokens, ts: now })
    return NextResponse.json({ tokens })
  } catch {
    return NextResponse.json({ tokens: [] }, { status: 500 })
  }
}
