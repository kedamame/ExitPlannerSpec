'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect, useReadContracts } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { erc20Abi, formatUnits } from 'viem'

interface TokenInfo {
  coinId: string
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

// Popular ERC-20 tokens on Ethereum & Base
const KNOWN_TOKENS = [
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as `0x${string}`, symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin', decimals: 6 },
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' as `0x${string}`, symbol: 'USDT', name: 'Tether', coinId: 'tether', decimals: 6 },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' as `0x${string}`, symbol: 'WBTC', name: 'Wrapped Bitcoin', coinId: 'wrapped-bitcoin', decimals: 8 },
  { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' as `0x${string}`, symbol: 'WETH', name: 'Wrapped Ether', coinId: 'weth', decimals: 18 },
  { address: '0x6b175474e89094c44da98b954eedeac495271d0f' as `0x${string}`, symbol: 'DAI', name: 'Dai', coinId: 'dai', decimals: 18 },
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' as `0x${string}`, symbol: 'UNI', name: 'Uniswap', coinId: 'uniswap', decimals: 18 },
  { address: '0x514910771af9ca656af840dff83e8264ecf986ca' as `0x${string}`, symbol: 'LINK', name: 'Chainlink', coinId: 'chainlink', decimals: 18 },
  { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' as `0x${string}`, symbol: 'AAVE', name: 'Aave', coinId: 'aave', decimals: 18 },
  // Base chain USDC
  { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as `0x${string}`, symbol: 'USDC', name: 'USD Coin (Base)', coinId: 'usd-coin', decimals: 6 },
  { address: '0x4200000000000000000000000000000000000006' as `0x${string}`, symbol: 'WETH', name: 'Wrapped Ether (Base)', coinId: 'weth', decimals: 18 },
]

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
  const [loadingTokens, setLoadingTokens] = useState(false)
  const router = useRouter()

  // Read balanceOf for all known tokens
  const contracts = address
    ? KNOWN_TOKENS.map((t) => ({
        address: t.address,
        abi: erc20Abi,
        functionName: 'balanceOf' as const,
        args: [address],
      }))
    : []

  const { data: balances, isLoading: balancesLoading } = useReadContracts({
    contracts,
    query: { enabled: !!address },
  })

  useEffect(() => {
    if (!balances || balancesLoading || !address) return
    setLoadingTokens(true)

    const nonZero = KNOWN_TOKENS.map((t, i) => {
      const result = balances[i]
      if (result?.status !== 'success') return null
      const raw = result.result as bigint
      if (raw === 0n) return null
      const formatted = parseFloat(formatUnits(raw, t.decimals))
      if (formatted < 0.0001) return null
      return { ...t, balance: formatted }
    }).filter(Boolean) as (typeof KNOWN_TOKENS[0] & { balance: number })[]

    if (nonZero.length === 0) {
      setTokens([])
      setLoadingTokens(false)
      return
    }

    // Fetch USD prices for found tokens
    const coinIds = [...new Set(nonZero.map((t) => t.coinId))].join(',')
    fetch(`/api/price-multi?ids=${coinIds}`)
      .then((r) => r.json())
      .then((prices: Record<string, number>) => {
        const result: TokenInfo[] = nonZero.map((t) => ({
          coinId: t.coinId,
          symbol: t.symbol,
          name: t.name,
          balance: t.balance < 0.01
            ? t.balance.toFixed(6)
            : t.balance < 1000
            ? t.balance.toFixed(4)
            : t.balance.toFixed(2),
          usdValue: prices[t.coinId] ? prices[t.coinId] * t.balance : undefined,
        }))
        setTokens(result)
      })
      .catch(() => {
        setTokens(nonZero.map((t) => ({
          coinId: t.coinId,
          symbol: t.symbol,
          name: t.name,
          balance: t.balance.toFixed(4),
        })))
      })
      .finally(() => setLoadingTokens(false))
  }, [balances, balancesLoading, address])

  const handleConnectEVM = () => {
    connect({ connector: injected() })
  }

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

        {balancesLoading || loadingTokens ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-purple-400 rounded-full animate-spin" />
            Loading tokens...
          </div>
        ) : tokens.length > 0 ? (
          <div>
            <p className="text-xs text-gray-500 mb-2">{walletTokensLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {tokens.map((t, i) => (
                <button
                  key={`${t.coinId}-${i}`}
                  onClick={() => router.push(`/chart/${t.coinId}`)}
                  className="flex flex-col bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">{t.symbol}</span>
                    <span className="text-gray-400 text-xs">{t.balance}</span>
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
          <p className="text-gray-500 text-sm">No ERC-20 tokens found</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <button
        onClick={handleConnectEVM}
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
