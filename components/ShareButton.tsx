'use client'

import { useState } from 'react'
import type { Position } from '@/types'
import { buildCastText } from '@/lib/farcaster'

interface Props {
  position: Position
  currentPrice: number
  locale?: string
  label?: string
}

export function ShareButton({ position, currentPrice, locale = 'en', label = 'Share as Cast' }: Props) {
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const tpPrices = position.lines.filter((l) => l.type === 'takeProfit').map((l) => l.price).join(',')
      const slPrices = position.lines.filter((l) => l.type === 'stopLoss').map((l) => l.price).join(',')
      const ogUrl = `${appUrl}/api/og?coinName=${encodeURIComponent(position.coinName)}&coinSymbol=${encodeURIComponent(position.coinSymbol)}&price=${currentPrice}&tp=${tpPrices}&sl=${slPrices}`
      const castText = buildCastText(position, locale)

      // Try Farcaster SDK if available
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.composeCast({
          text: castText,
          embeds: [ogUrl],
        })
      } catch {
        // Fallback: open Warpcast compose URL
        const params = new URLSearchParams({ text: castText, 'embeds[]': ogUrl })
        window.open(`https://warpcast.com/~/compose?${params.toString()}`, '_blank')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition"
    >
      {sharing ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {label}
    </button>
  )
}
