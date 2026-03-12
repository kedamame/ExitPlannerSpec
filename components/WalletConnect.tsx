'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useReadContracts } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { erc20Abi, formatUnits } from 'viem'
import type { TokenMeta } from '@/app/api/wallet-tokens/route'

interface TokenInfo {
  coinId: string
  contractAddress: string
  symbol: string
  name: string
  balance: string
  usdValue?: number
}

interface Props {
  connectEVMLabel?: string
  connectSolanaLabel?: string
  walletTokensLabel?: string
  disconnectLabel?: string
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
  const [tokenMetas, setTokenMetas] = useState<TokenMeta[]>([])
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const router = useRouter()

  // Step 1: Fetch token list from Etherscan/Basescan when wallet connects
  useEffect(() => {
    if (!address) { setTokenMetas([]); setTokens([]); return }
    setLoadingMeta(true)
    fetch(`/api/wallet-tokens?address=${address}`)
      .then((r) => r.json())
      .then((data) => setTokenMetas(data.tokens ?? []))
      .catch(() => setTokenMetas([]))
      .finally(() => setLoadingMeta(false))
  }, [address])

  // Step 2: Read balanceOf for all discovered tokens
  const contracts = address && tokenMetas.length > 0
    ? tokenMetas.slice(0, 100).map((t) => ({
        address: t.contractAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [address],
      }))
    : []

  const { data: balances, isLoading: balancesLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  })

  // Step 3: Filter non-zero balances and fetch USD prices
  useEffect(() => {
    if (!balances || balancesLoading || tokenMetas.length === 0) return
    setLoadingBalances(true)

    const nonZero = tokenMetas.slice(0, 100).map((t, i) => {
      const result = balances[i]
      if (result?.status !== 'success') return null
      const raw = result.result as bigint
      if (raw === 0n) return null
      const fmt = parseFloat(formatUnits(raw, t.decimals))
      if (fmt < 0.0001) return null
      return { ...t, balanceNum: fmt }
    }).filter(Boolean) as (TokenMeta & { balanceNum: number })[]

    if (nonZero.length === 0) {
      setTokens([])
      setLoadingBalances(false)
      return
    }

    // Look up CoinGecko IDs + prices by contract addresses
    const addrs = nonZero.map((t) => t.contractAddress).join(',')
    fetch(`/api/coingecko-ids?addresses=${encodeURIComponent(addrs)}`)
      .then((r) => r.json())
      .then((idMap: Record<string, { id: string; usd: number }>) => {
        const result: TokenInfo[] = nonZero.map((t) => {
          const info = idMap[t.contractAddress]
          const bal = t.balanceNum
          return {
            coinId: info?.id ?? t.symbol.toLowerCase(),
            contractAddress: t.contractAddress,
            symbol: t.symbol,
            name: t.name,
            balance: bal < 0.01 ? bal.toFixed(6) : bal < 1000 ? bal.toFixed(4) : bal.toFixed(2),
            usdValue: info?.usd ? info.usd * bal : undefined,
          }
        })
        setTokens(result)
      })
      .catch(() => {
        setTokens(nonZero.map((t) => ({
          coinId: t.symbol.toLowerCase(),
          contractAddress: t.contractAddress,
          symbol: t.symbol,
          name: t.name,
          balance: t.balanceNum.toFixed(4),
        })))
      })
      .finally(() => setLoadingBalances(false))
  }, [balances, balancesLoading, tokenMetas])

  const isLoading = loadingMeta || balancesLoading || loadingBalances

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
              {tokens.map((t, i) => (
                <button
                  key={`${t.contractAddress}-${i}`}
                  onClick={() => router.push(`/chart/${t.coinId}`)}
                  className="flex flex-col bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition text-left"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-white font-medium text-sm truncate">{t.symbol}</span>
                    <span className="text-gray-400 text-xs shrink-0">{t.balance}</span>
                  </div>
                  {t.usdValue !== undefined && (
                    <span className="text-gray-500 text-xs mt-0.5">
                      ≈${t.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </button>
              ))}
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
