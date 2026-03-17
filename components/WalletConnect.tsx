'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useReadContracts } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { erc20Abi, formatUnits } from 'viem'
import { ETHEREUM_TOKENS, BASE_TOKENS } from '@/lib/knownTokens'
import type { TokenMeta } from '@/app/api/wallet-tokens/route'

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

const KNOWN_ETH_MAP = new Map(ETHEREUM_TOKENS.map((t) => [t.address.toLowerCase(), t]))
const KNOWN_BASE_MAP = new Map(BASE_TOKENS.map((t) => [t.address.toLowerCase(), t]))

function getKnown(address: string) {
  return KNOWN_ETH_MAP.get(address) ?? KNOWN_BASE_MAP.get(address) ?? null
}

const CHAIN_ID: Record<Chain, number> = { eth: 1, base: 8453 }

const CHAIN_BADGE: Record<Chain, { label: string; className: string }> = {
  eth:  { label: 'ERC-20', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  base: { label: 'Base',   className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
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
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(false)
  // Fallback mode: tokens without pre-computed balance (Etherscan / known-only)
  const [fallbackList, setFallbackList] = useState<MergedToken[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!address) { setTokens([]); setFallbackList([]); return }
    setLoading(true)

    fetch(`/api/wallet-tokens?address=${address}`)
      .then((r) => r.json())
      .then((data) => {
        const apiTokens: TokenMeta[] = data.tokens ?? []

        // === Ankr mode: balance already available ===
        if (apiTokens.length > 0 && apiTokens[0].balance !== undefined) {
          const nonZero = apiTokens.filter((t) => parseFloat(t.balance ?? '0') >= 0.0001)
          if (nonZero.length === 0) { setTokens([]); setLoading(false); return }

          // Resolve coinIds via coingecko-ids (address-based)
          const addrs = nonZero.map((t) => t.contractAddress).join(',')
          fetch(`/api/coingecko-ids?addresses=${encodeURIComponent(addrs)}`)
            .then((r) => r.json())
            .then((idMap: Record<string, { id: string; usd: number }>) => {
              setTokens(nonZero.map((t) => {
                const resolved = idMap[t.contractAddress]
                const known = getKnown(t.contractAddress)
                const coinId = resolved?.id ?? known?.coinId ?? t.symbol.toLowerCase()
                const bal = parseFloat(t.balance ?? '0')
                return {
                  coinId,
                  contractAddress: t.contractAddress,
                  symbol: t.symbol,
                  name: t.name,
                  chain: t.chain,
                  balance: bal < 0.01 ? bal.toFixed(6) : bal < 1000 ? bal.toFixed(4) : bal.toFixed(2),
                  usdValue: t.usdValue && t.usdValue > 0 ? t.usdValue : (resolved?.usd ? resolved.usd * bal : undefined),
                }
              }))
            })
            .catch(() => {
              setTokens(nonZero.map((t) => {
                const known = getKnown(t.contractAddress)
                const bal = parseFloat(t.balance ?? '0')
                return {
                  coinId: known?.coinId ?? t.symbol.toLowerCase(),
                  contractAddress: t.contractAddress,
                  symbol: t.symbol,
                  name: t.name,
                  chain: t.chain,
                  balance: bal.toFixed(4),
                  usdValue: t.usdValue && t.usdValue > 0 ? t.usdValue : undefined,
                }
              }))
            })
            .finally(() => setLoading(false))
          return
        }

        // === Fallback mode: need on-chain balanceOf ===
        const allKnown = new Map<string, MergedToken>([
          ...Array.from(KNOWN_ETH_MAP.entries()).map(([addr, t]) =>
            [addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'eth' as Chain }] as const
          ),
          ...Array.from(KNOWN_BASE_MAP.entries()).map(([addr, t]) =>
            [addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'base' as Chain }] as const
          ),
        ])
        const merged = new Map(allKnown)
        for (const t of apiTokens) {
          const addr = t.contractAddress.toLowerCase()
          if (!merged.has(addr)) {
            merged.set(addr, { address: addr, symbol: t.symbol, name: t.name, decimals: t.decimals, chain: t.chain })
          }
        }
        setFallbackList(Array.from(merged.values()))
        setLoading(false)
      })
      .catch(() => {
        // Known tokens only fallback
        const allKnown: MergedToken[] = [
          ...Array.from(KNOWN_ETH_MAP.values()).map((t) => ({ address: t.address.toLowerCase(), symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'eth' as Chain })),
          ...Array.from(KNOWN_BASE_MAP.values()).map((t) => ({ address: t.address.toLowerCase(), symbol: t.symbol, name: t.name, decimals: t.decimals, chain: 'base' as Chain })),
        ]
        setFallbackList(allKnown)
        setLoading(false)
      })
  }, [address])

  // Fallback: on-chain balanceOf split by chain
  const ethFallbackTokens = fallbackList.filter((t) => t.chain === 'eth')
  const baseFallbackTokens = fallbackList.filter((t) => t.chain === 'base')

  const makeContracts = (tokens: MergedToken[], chainId: number) =>
    address && tokens.length > 0
      ? tokens.map((t) => ({
          address: t.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf' as const,
          args: [address],
          chainId,
        }))
      : []

  const ethContracts = makeContracts(ethFallbackTokens, CHAIN_ID.eth)
  const baseContracts = makeContracts(baseFallbackTokens, CHAIN_ID.base)

  const { data: ethBalances, isLoading: ethLoading } = useReadContracts({
    contracts: ethContracts,
    query: { enabled: ethContracts.length > 0 },
  })
  const { data: baseBalances, isLoading: baseLoading } = useReadContracts({
    contracts: baseContracts,
    query: { enabled: baseContracts.length > 0 },
  })

  const fallbackBalancesLoading = ethLoading || baseLoading

  useEffect(() => {
    if (fallbackList.length === 0) return
    if (!address) return
    if (fallbackBalancesLoading) return
    if (ethContracts.length > 0 && !ethBalances) return
    if (baseContracts.length > 0 && !baseBalances) return
    setLoading(true)

    function extractNonZero(tokenArr: MergedToken[], balances: typeof ethBalances) {
      return tokenArr.map((t, i) => {
        const result = balances?.[i]
        if (result?.status !== 'success') return null
        const raw = result.result as bigint
        if (raw === 0n) return null
        const fmt = parseFloat(formatUnits(raw, t.decimals))
        if (fmt < 0.0001) return null
        return { ...t, balanceNum: fmt }
      }).filter(Boolean) as (MergedToken & { balanceNum: number })[]
    }

    const nonZero = [
      ...extractNonZero(ethFallbackTokens, ethBalances),
      ...extractNonZero(baseFallbackTokens, baseBalances),
    ]

    if (nonZero.length === 0) { setTokens([]); setLoading(false); return }

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
      .finally(() => setLoading(false))
  }, [address, ethBalances, baseBalances, fallbackBalancesLoading, fallbackList]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = loading || (fallbackList.length > 0 && fallbackBalancesLoading)

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
            <p className="text-xs text-gray-500 mb-1">{walletTokensLabel} ({tokens.length})</p>
            <p className="text-[10px] text-gray-600 mb-2">* 過去24時間以内に受け取ったことがないトークンは表示されない場合があります</p>
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
