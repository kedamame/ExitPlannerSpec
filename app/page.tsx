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
  },
}

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
          <p className="text-gray-400">{t.subtitle}</p>
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
