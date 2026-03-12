'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

interface TokenInfo {
  coinId: string
  symbol: string
  name: string
  balance: string
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
  const [tokens] = useState<TokenInfo[]>([])
  const router = useRouter()

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
        {tokens.length > 0 ? (
          <div>
            <p className="text-xs text-gray-500 mb-2">{walletTokensLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {tokens.map((t) => (
                <button
                  key={t.coinId}
                  onClick={() => router.push(`/chart/${t.coinId}`)}
                  className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition"
                >
                  <span className="text-white font-medium text-sm">{t.symbol}</span>
                  <span className="text-gray-400 text-xs">{t.balance}</span>
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
