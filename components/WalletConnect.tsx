'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useReadContracts } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { erc20Abi, formatUnits } from 'viem'
import { ETHEREUM_TOKENS, BASE_TOKENS } from '@/lib/knownTokens'

type Chain = 'eth' | 'base'

interface MergedToken {
  address: string
  symbol: string
  name: string
  decimals: number
  chain: Chain
}

interface TokenInfo {
  coinId: string
  contractAddress: string
  symbol: string
  name: string
  balance: string
  chain: Chain
  usdValue?: number
}

interface Props {
  connectEVMLabel?: string
  connectSolanaLabel?: string
  walletTokensLabel?: string
  disconnectLabel?: string
}

// Address → chain lookup for known tokens
const KNOWN_ETH_MAP = new Map(ETHEREUM_TOKENS.map((t) => [t.address.toLowerCase(), t]))
const KNOWN_BASE_MAP = new Map(BASE_TOKENS.map((t) => [t.address.toLowerCase(), t]))

function getKnown(address: string) {
  return KNOWN_ETH_MAP.get(address) ?? KNOWN_BASE_MAP.get(address) ?? null
}

const CHAIN_ID: Record<Chain, number> = { eth: 1, base: 8453 }

const CHAIN_BADGE: Record<Chain, { label: string; className: string }> = {
  eth: { label: 'ERC-20', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  base: { label: 'ERC-20', className: 'bg-blue-600/20 text-blue-300 border border-blue-600/30' },
}

export function WalletConnect({
  connectEVMLabel = 'Connect EVM Wallet',
  connectSolanaLabel = 'Connect Solana Wallet',
  walletTokensLabel = 'Held Tokens',
  disconnectLabel = 'Disconnect',
}: Props) {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [tokenList, setTokenList] = useState<MergedToken[]>([])
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const router = useRouter()

  // Build token list: known tokens + API-discovered tokens merged
  useEffect(() => {
    if (!address) { setTokenList([]); setTokens([]); return }
    setLoadingList(true)

    const allKnown = new Map<string, MergedToken>([
      ...Array.from(KNOWN_ETH_MAP.entries()).map(([addr, t]) =>
        [addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'eth' as Chain }] as const
      ),
      ...Array.from(KNOWN_BASE_MAP.entries()).map(([addr, t]) =>
        [addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'base' as Chain }] as const
      ),
    ])

    fetch(`/api/wallet-tokens?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        const apiTokens: Array<{ contractAddress: string; symbol: string; name: string; decimals: number; chain: Chain }> =
          data.tokens ?? []
        const merged = new Map(allKnown)
        for (const t of apiTokens) {
          const addr = t.contractAddress.toLowerCase()
          if (!merged.has(addr)) {
            merged.set(addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: t.chain ?? 'eth' })
          }
        }
        setTokenList(Array.from(merged.values()))
      })
      .catch(() => setTokenList(Array.from(allKnown.values())))
      .finally(() => setLoadingList(false))
  }, [address])

  // Read balanceOf for all tokens — specify chainId so Base tokens are queried on chain 8453
  const contracts = address && tokenList.length > 0
    ? tokenList.map((t) => ({
        address: t.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [address],
        chainId: CHAIN_ID[t.chain],
      }))
    : []

  const { data: balances, isLoading: balancesLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  })

  // Filter non-zero balances and fetch prices
  useEffect(() => {
    if (!address) { setTokens([]); return }
    if (!balances || balancesLoading || tokenList.length === 0) return
    setLoadingPrices(true)

    const nonZero = tokenList.map((t, i) => {
      const result = balances[i]
      if (result?.status !== 'success') return null
      const raw = result.result as bigint
      if (raw === 0n) return null
      const fmt = parseFloat(formatUnits(raw, t.decimals))
      if (fmt < 0.0001) return null
      return { ...t, balanceNum: fmt }
    }).filter(Boolean) as (MergedToken & { balanceNum: number })[]

    if (nonZero.length === 0) {
      setTokens([])
      setLoadingPrices(false)
      return
    }

    const addrs = nonZero.map((t) => t.address).join(',')
    fetch(`/api/coingecko-ids?addresses=${encodeURIComponent(addrs)}`)
      .then((r) => r.json())
      .then((idMap: Record<string, { id: string; usd: number }>) => {
        setTokens(nonZero.map((t) => {
          const resolved = idMap[t.address]
          const known = getKnown(t.address)
          const coinId = resolved?.id ?? known?.coinId ?? t.symbol.toLowerCase()
          const bal = t.balanceNum
          return {
            coinId,
            contractAddress: t.address,
            symbol: t.symbol,
            name: t.name,
            chain: t.chain,
            balance: bal < 0.01 ? bal.toFixed(6) : bal < 1000 ? bal.toFixed(4) : bal.toFixed(2),
            usdValue: resolved?.usd ? resolved.usd * bal : undefined,
          }
        }))
      })
      .catch(() => {
        setTokens(nonZero.map((t) => {
          const known = getKnown(t.address)
          return {
            coinId: known?.coinId ?? t.symbol.toLowerCase(),
            contractAddress: t.address,
            symbol: t.symbol,
            name: t.name,
            chain: t.chain,
            balance: t.balanceNum.toFixed(4),
          }
        }))
      })
      .finally(() => setLoadingPrices(false))
  }, [address, balances, balancesLoading, tokenList])

  const isLoading = loadingList || balancesLoading || loadingPrices

  if (isConnected && address) {
    return (
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            {disconnectLabel}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-purple-400 rounded-full animate-spin" />
            Loading tokens...
          </div>
        ) : tokens.length > 0 ? (
          <div>
            <p className="text-xs text-gray-500 mb-2">{walletTokensLabel} ({tokens.length})</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {tokens.map((t, i) => {
                const badge = CHAIN_BADGE[t.chain]
                return (
                  <button
                    key={`${t.contractAddress}-${i}`}
                    onClick={() => router.push(`/chart/${t.coinId}`)}
                    className="flex flex-col bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition text-left"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-white font-medium text-sm truncate">{t.symbol}</span>
                      <span className="text-gray-400 text-xs shrink-0">{t.balance}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      {t.usdValue !== undefined && (
                        <span className="text-gray-500 text-xs">
                          ≈${t.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No tokens found</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <button
        onClick={() => connect({ connector: injected() })}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-3 font-medium transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {connectEVMLabel}
      </button>
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-gray-700 text-gray-500 rounded-xl px-6 py-3 font-medium cursor-not-allowed"
      >
        {connectSolanaLabel}
        <span className="text-xs">(coming soon)</span>
      </button>
    </div>
  )
}
