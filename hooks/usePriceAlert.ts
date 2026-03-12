'use client'

import { useEffect, useRef } from 'react'
import type { PriceLine } from '@/types'

const THRESHOLD = 0.005 // 0.5%

export function usePriceAlert(
  coinName: string,
  currentPrice: number,
  lines: PriceLine[],
  alertEnabled: boolean,
  locale: string = 'en'
) {
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!alertEnabled || currentPrice === 0) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    for (const line of lines) {
      const diff = Math.abs(currentPrice - line.price) / line.price
      if (diff <= THRESHOLD) {
        const key = `${line.id}-${Math.floor(currentPrice / (line.price * THRESHOLD))}`
        if (!notifiedRef.current.has(key)) {
          notifiedRef.current.add(key)
          const lineType = line.type === 'takeProfit'
            ? (locale === 'ja' ? '利確' : 'Take Profit')
            : (locale === 'ja' ? '損切り' : 'Stop Loss')
          const msg = locale === 'ja'
            ? `「${coinName}」が${lineType}ライン（${line.price}）に近づいています`
            : `${coinName} is approaching your ${lineType} line at ${line.price}`
          new Notification('Exit Planner', { body: msg })
        }
      }
    }
  }, [currentPrice, lines, alertEnabled, coinName, locale])
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}
