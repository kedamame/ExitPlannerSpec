import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, erc20Abi, formatUnits } from 'viem'
import { base } from 'viem/chains'
import { BASE_TOKENS } from '@/lib/knownTokens'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const cache = new Map<string, { data: TokenMeta[]; ts: number }>()
const CACHE_TTL = 60000 // 1 min

export interface TokenMeta {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  chain: 'eth' | 'base'
  balance?: string    // human-readable balance — skip on-chain balanceOf when present
  usdValue?: number   // USD value
}

// Server-side viem client for Base — always reliable, no API key needed
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

// Direct on-chain multicall against known Base tokens
async function fetchBaseBalancesOnChain(address: string): Promise<TokenMeta[]> {
  try {
    const results = await baseClient.multicall({
      contracts: BASE_TOKENS.map((t) => ({
        address: t.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [address as `0x${string}`],
      })),
      allowFailure: true,
    })
    return BASE_TOKENS.map((t, i) => {
      const result = results[i]
      if (!result || result.status !== 'success') return null
      const raw = result.result as bigint
      const fmt = parseFloat(formatUnits(raw, t.decimals))
      if (fmt < 0.0001) return null
      return {
        contractAddress: t.address.toLowerCase(),
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        chain: 'base' as const,
        balance: fmt < 0.01 ? fmt.toFixed(6) : fmt < 1000 ? fmt.toFixed(4) : fmt.toFixed(2),
      }
    }).filter(Boolean) as TokenMeta[]
  } catch {
    return []
  }
}

// Ankr free API — returns all ERC-20 balances across chains
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
    blockchain: string
    balance: string
    balanceUsd: string
  }>)
    .filter((a) => a.tokenType === 'ERC20' && a.contractAddress)
    .map((a) => ({
      contractAddress: a.contractAddress!.toLowerCase(),
      symbol: a.tokenSymbol,
      name: a.tokenName,
      decimals: a.tokenDecimals ?? 18,
      chain: a.blockchain === 'base' ? 'base' : 'eth',
      balance: a.balance,
      usdValue: parseFloat(a.balanceUsd ?? '0') || undefined,
    }))
}

async function fetchTokenTx(
  apiUrl: string,
  address: string,
  chain: 'eth' | 'base',
  apiKey?: string,
): Promise<TokenMeta[]> {
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
        chain,
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
    // Run Ankr + Base on-chain multicall in parallel
    const [ankrResult, baseOnChainResult] = await Promise.allSettled([
      fetchAnkrTokens(address),
      fetchBaseBalancesOnChain(address),
    ])

    const ankrTokens = ankrResult.status === 'fulfilled' ? ankrResult.value : []
    const baseOnChain = baseOnChainResult.status === 'fulfilled' ? baseOnChainResult.value : []

    // Merge: Ankr provides broader coverage; Base on-chain is the ground truth for known Base tokens
    const all = new Map<string, TokenMeta>()
    for (const t of ankrTokens) all.set(t.contractAddress, t)
    // Override/add Base tokens from on-chain (authoritative for known Base tokens)
    for (const t of baseOnChain) {
      all.set(t.contractAddress, t)
    }

    if (all.size > 0) {
      const tokens = Array.from(all.values())
      cache.set(cacheKey, { data: tokens, ts: now })
      return NextResponse.json({ tokens })
    }

    // Final fallback: Etherscan/Basescan (no balance data)
    const ethKey = process.env.ETHERSCAN_API_KEY
    const baseKey = process.env.BASESCAN_API_KEY ?? ethKey
    const [ethTokens, baseTokens] = await Promise.allSettled([
      fetchTokenTx('https://api.etherscan.io/api', address, 'eth', ethKey),
      fetchTokenTx('https://api.basescan.org/api', address, 'base', baseKey),
    ])

    const fallback = new Map<string, TokenMeta>()
    if (ethTokens.status === 'fulfilled') {
      for (const t of ethTokens.value) fallback.set(t.contractAddress, t)
    }
    if (baseTokens.status === 'fulfilled') {
      for (const t of baseTokens.value) fallback.set(t.contractAddress, t)
    }

    const tokens = Array.from(fallback.values())
    cache.set(cacheKey, { data: tokens, ts: now })
    return NextResponse.json({ tokens })
  } catch {
    return NextResponse.json({ tokens: [] }, { status: 500 })
  }
}
