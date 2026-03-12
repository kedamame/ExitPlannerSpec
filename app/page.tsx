'use client'

import { useEffect } from 'react'
import { CoinSearch } from '@/components/CoinSearch'
import { WalletConnect } from '@/components/WalletConnect'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const messages = {
  en: {
    title: 'Exit Planner',
    subtitle: 'Set your exit strategy for held coins',
    searchPlaceholder: 'Enter ticker or contract address',
    connectEVM: 'Connect EVM Wallet',
    connectSolana: 'Connect Solana Wallet',
    walletTokens: 'Held Tokens',
    disconnect: 'Disconnect',
    or: 'or',
    supportedChains: 'Supported Chains',
  },
  ja: {
    title: 'Exit Planner',
    subtitle: '保有コインの出口戦略を設定しよう',
    searchPlaceholder: 'ティッカーまたはコントラクトアドレスを入力',
    connectEVM: 'EVMウォレット接続',
    connectSolana: 'Solanaウォレット接続',
    walletTokens: '保有トークン',
    disconnect: '切断',
    or: 'または',
    supportedChains: '対応チェーン',
  },
}

const CHAINS = [
  {
    name: 'Ethereum',
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
      </svg>
    ),
  },
  {
    name: 'Base',
    color: 'bg-blue-600/10 border-blue-600/30 text-blue-300',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity="0.2"/>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4a6 6 0 110 12A6 6 0 0112 6z"/>
      </svg>
    ),
  },
  {
    name: 'Solana',
    color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 7h13.5l-2.5 2.5H4V7zm0 7.5h13.5L15 17H4v-2.5zm2.5-3.75H18L15.5 13.25H6.5v-2.5z"/>
      </svg>
    ),
  },
]

export default function HomePage() {
  const [locale] = useLocalStorage<'en' | 'ja'>('exit_planner_locale', 'en')
  const t = messages[locale] ?? messages.en

  // Initialize Farcaster SDK
  useEffect(() => {
    import('@farcaster/miniapp-sdk').then(({ sdk }) => {
      sdk.actions.ready().catch(() => {})
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            EP
          </div>
          <span className="font-bold text-white text-lg">{t.title}</span>
        </div>
        <LanguageToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-gray-400 mb-4">{t.subtitle}</p>
          {/* Supported chains */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">{t.supportedChains}:</span>
            {CHAINS.map((chain) => (
              <span
                key={chain.name}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${chain.color}`}
              >
                {chain.icon}
                {chain.name}
              </span>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="w-full max-w-lg">
          <CoinSearch placeholder={t.searchPlaceholder} />
        </div>

        <div className="text-gray-600 text-sm">{t.or}</div>

        {/* Wallet Connect */}
        <WalletConnect
          connectEVMLabel={t.connectEVM}
          connectSolanaLabel={t.connectSolana}
          walletTokensLabel={t.walletTokens}
          disconnectLabel={t.disconnect}
        />
      </main>
    </div>
  )
}
