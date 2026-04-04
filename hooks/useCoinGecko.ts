'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OHLCData, Timeframe } from '@/types'
import { TIMEFRAME_CONFIGS } from '@/lib/coingecko'

export function useCurrentPrice(coinId: string) {
  const [price, setPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`/api/price/${coinId}`)
      if (res.ok) {
        const data = await res.json()
        setPrice(data.price)
      }
    } catch (e) {
      console.error('price fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [coinId])

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [fetchPrice])

  return { price, loading, refetch: fetchPrice }
}

export function useOHLC(coinId: string, timeframe: Timeframe) {
  const [data, setData] = useState<OHLCData[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const requestKey = `${coinId}:${timeframe}`

  useEffect(() => {
    const config = TIMEFRAME_CONFIGS.find((c) => c.label === timeframe)
    if (!config) return

    let cancelled = false

    fetch(`/api/ohlc/${coinId}?days=${config.days}&timeframe=${timeframe}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setData(d.data ?? [])
        setLoadedKey(requestKey)
      })
      .catch((e) => {
        if (cancelled) return
        console.error('OHLC fetch error', e)
        setData([])
        setLoadedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
  }, [coinId, timeframe, requestKey])

  return { data, loading: loadedKey !== requestKey }
}
