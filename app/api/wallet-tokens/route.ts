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

// Ankr free API — returns all ERC-20 balances without an API key
async function fetchAnkrTokens(address: string): Promise<TokenMeta[]> {
  const res = await fetch('https://rpc.ankr.com/multichain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'ankr_getAccountBalance',
      params: {
        walletAddress: address,
        blockchain: ['eth', 'base'],
        onlyWhitelisted: false,
        pageSize: 50,
      },
      id: 1,
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  if (data.error || !data.result?.assets) return []

  return (data.result.assets as Array<{
    tokenType: string
    contractAddress?: string
    tokenSymbol: string
    tokenName: string
    tokenDecimals: number
    balance: string
  }>)
    .filter((a) => a.tokenType === 'ERC20' && a.contractAddress)
    .map((a) => ({
      contractAddress: a.contractAddress!.toLowerCase(),
      symbol: a.tokenSymbol,
      name: a.tokenName,
      decimals: a.tokenDecimals ?? 18,
    }))
}

async function fetchTokenTx(apiUrl: string, address: string, apiKey?: string): Promise<TokenMeta[]> {
  const url = `${apiUrl}?module=account&action=tokentx&address=${address}&sort=desc&offset=200&page=1${apiKey ? `&apikey=${apiKey}` : ''}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  if (data.status !== '1' || !Array.isArray(data.result)) return []

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

  try {
    // Try Ankr first (no API key required, returns full token list)
    const ankrTokens = await fetchAnkrTokens(address)
    if (ankrTokens.length > 0) {
      cache.set(cacheKey, { data: ankrTokens, ts: now })
      return NextResponse.json({ tokens: ankrTokens })
    }

    // Fall back to Etherscan/Basescan
    const ethKey = process.env.ETHERSCAN_API_KEY
    const baseKey = process.env.BASESCAN_API_KEY ?? ethKey
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
