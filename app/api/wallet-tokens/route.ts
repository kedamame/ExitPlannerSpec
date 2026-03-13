import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, erc20Abi, formatUnits, parseAbiItem } from 'viem'
import { mainnet, base } from 'viem/chains'
import { ETHEREUM_TOKENS, BASE_TOKENS } from '@/lib/knownTokens'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const cache = new Map<string, { data: TokenMeta[]; ts: number }>()
const CACHE_TTL = 60000

export interface TokenMeta {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  chain: 'eth' | 'base'
  balance?: string
  usdValue?: number
}

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
)

// Use LlamaRPC — reliable public endpoints with getLogs support
const ethClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
})
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://base.llamarpc.com'),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPublicClient = any
type KnownMap = Map<string, { symbol: string; name: string; decimals: number; coinId: string }>

const ETH_KNOWN = new Map(ETHEREUM_TOKENS.map((t) => [t.address.toLowerCase(), t]))
const BASE_KNOWN = new Map(BASE_TOKENS.map((t) => [t.address.toLowerCase(), t]))

/**
 * Scan Transfer logs to discover tokens received by the address,
 * then multicall balanceOf (+ symbol/decimals for unknown tokens).
 */
async function scanChainTokens(
  client: AnyPublicClient,
  address: string,
  knownMap: KnownMap,
  chain: 'eth' | 'base',
  blockRange: bigint,
): Promise<TokenMeta[]> {
  try {
    const latest = await client.getBlockNumber()
    const fromBlock = latest > blockRange ? latest - blockRange : 0n

    // Discover ERC-20 contract addresses via Transfer events
    let logAddrs: string[] = []
    try {
      const logs = await client.getLogs({
        event: TRANSFER_EVENT,
        args: { to: address as `0x${string}` },
        fromBlock,
        toBlock: 'latest',
      })
      logAddrs = [...new Set((logs as Array<{ address: string }>).map((l) => l.address.toLowerCase()))]
    } catch {
      // getLogs may fail if range too large — fall back to known tokens only
    }

    // Merge log-discovered + hardcoded known addresses
    const knownAddrs = [...knownMap.keys()]
    const allAddrs = [...new Set([...logAddrs, ...knownAddrs])]
    if (allAddrs.length === 0) return []

    // Multicall balanceOf
    const balResults = await client.multicall({
      contracts: allAddrs.map((addr) => ({
        address: addr as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [address as `0x${string}`],
      })),
      allowFailure: true,
    })

    const nonZeroAddrs = allAddrs.filter((_, i) => {
      const r = balResults[i]
      return r?.status === 'success' && (r.result as bigint) > 0n
    })
    if (nonZeroAddrs.length === 0) return []

    // For unknown tokens fetch symbol/decimals/name in one multicall
    const unknownAddrs = nonZeroAddrs.filter((a) => !knownMap.has(a))
    let unknownMeta: Array<{ symbol: string; decimals: number; name: string }> = []
    if (unknownAddrs.length > 0) {
      const metaResults = await client.multicall({
        contracts: unknownAddrs.flatMap((addr) => [
          { address: addr as `0x${string}`, abi: erc20Abi, functionName: 'symbol' as const },
          { address: addr as `0x${string}`, abi: erc20Abi, functionName: 'decimals' as const },
          { address: addr as `0x${string}`, abi: erc20Abi, functionName: 'name' as const },
        ]),
        allowFailure: true,
      })
      unknownMeta = unknownAddrs.map((_, i) => ({
        symbol: (metaResults[i * 3]?.status === 'success' ? metaResults[i * 3].result : '???') as string,
        decimals: (metaResults[i * 3 + 1]?.status === 'success' ? metaResults[i * 3 + 1].result : 18) as number,
        name: (metaResults[i * 3 + 2]?.status === 'success' ? metaResults[i * 3 + 2].result : '???') as string,
      }))
    }

    return nonZeroAddrs.map((addr) => {
      const balIdx = allAddrs.indexOf(addr)
      const raw = (balResults[balIdx]?.status === 'success' ? balResults[balIdx].result : 0n) as bigint
      const known = knownMap.get(addr)
      const unknownIdx = unknownAddrs.indexOf(addr)
      const symbol = known?.symbol ?? unknownMeta[unknownIdx]?.symbol ?? '???'
      const decimals = known?.decimals ?? unknownMeta[unknownIdx]?.decimals ?? 18
      const name = known?.name ?? unknownMeta[unknownIdx]?.name ?? symbol
      const fmt = parseFloat(formatUnits(raw, decimals))
      if (fmt < 0.0001) return null
      return {
        contractAddress: addr,
        symbol,
        name,
        decimals,
        chain,
        balance: fmt < 0.01 ? fmt.toFixed(6) : fmt < 1000 ? fmt.toFixed(4) : fmt.toFixed(2),
      } satisfies TokenMeta
    }).filter(Boolean) as TokenMeta[]
  } catch {
    return []
  }
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
    // Base: scan last ~24h (Base ≈ 2s blocks → 43200 blocks/day)
    // ETH: scan last ~24h (ETH ≈ 12s blocks → 7200 blocks/day)
    const [ethTokens, baseTokens] = await Promise.allSettled([
      scanChainTokens(ethClient, address, ETH_KNOWN, 'eth', 7200n),
      scanChainTokens(baseClient, address, BASE_KNOWN, 'base', 43200n),
    ])

    const all = new Map<string, TokenMeta>()
    if (ethTokens.status === 'fulfilled') {
      for (const t of ethTokens.value) all.set(`eth:${t.contractAddress}`, t)
    }
    if (baseTokens.status === 'fulfilled') {
      for (const t of baseTokens.value) all.set(`base:${t.contractAddress}`, t)
    }

    const tokens = Array.from(all.values())
    cache.set(cacheKey, { data: tokens, ts: now })
    return NextResponse.json({ tokens })
  } catch {
    return NextResponse.json({ tokens: [] }, { status: 500 })
  }
}
