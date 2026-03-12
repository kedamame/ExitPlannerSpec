'use client'

import { useEffect, useRef, useState } from 'react'
import type { OHLCData, PriceLine, Timeframe } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LWChart = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LWSeries = any

interface Props {
  data: OHLCData[]
  lines: PriceLine[]
  currentPrice: number
  timeframe: Timeframe
  onTimeframeChange: (tf: Timeframe) => void
  // TODO: onLinePriceChange — drag-to-update line price (not yet supported by lightweight-charts v5)
}

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M']

export function CandlestickChart({
  data,
  lines,
  currentPrice,
  timeframe,
  onTimeframeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<LWChart>(null)
  const seriesRef = useRef<LWSeries>(null)
  const priceLineRefs = useRef<Map<string, LWSeries>>(new Map())
  const currentPriceLineRef = useRef<LWSeries>(null)
  const [chartReady, setChartReady] = useState(false)

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lwModule: any = null

    import('lightweight-charts').then((mod) => {
      if (!containerRef.current) return
      lwModule = mod

      const chart = mod.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { color: '#0f0f23' },
          textColor: '#a0a0c0',
        },
        grid: {
          vertLines: { color: '#1a1a3e' },
          horzLines: { color: '#1a1a3e' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#2a2a4e' },
        timeScale: { borderColor: '#2a2a4e', timeVisible: true },
      })

      const series = chart.addSeries(mod.CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      })

      chartRef.current = chart
      seriesRef.current = series
      setChartReady(true)

      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)

      // Store cleanup fn
      ;(containerRef.current as HTMLDivElement & { _cleanup?: () => void })._cleanup = () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    })

    return () => {
      const el = containerRef.current as (HTMLDivElement & { _cleanup?: () => void }) | null
      if (el?._cleanup) {
        el._cleanup()
      } else if (chartRef.current && lwModule) {
        chartRef.current.remove()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update data
  useEffect(() => {
    if (!chartReady || !seriesRef.current || data.length === 0) return
    seriesRef.current.setData(data)
  }, [data, chartReady])

  // Update current price line
  useEffect(() => {
    if (!chartReady || !seriesRef.current || currentPrice === 0) return

    if (currentPriceLineRef.current) {
      seriesRef.current.removePriceLine(currentPriceLineRef.current)
    }

    currentPriceLineRef.current = seriesRef.current.createPriceLine({
      price: currentPrice,
      color: '#fbbf24',
      lineWidth: 1,
      lineStyle: 2,
      title: `$${currentPrice.toLocaleString()}`,
    })
  }, [currentPrice, chartReady])

  // Update TP/SL lines
  useEffect(() => {
    if (!chartReady || !seriesRef.current) return

    priceLineRefs.current.forEach((line) => seriesRef.current.removePriceLine(line))
    priceLineRefs.current.clear()

    for (const line of lines) {
      const pl = seriesRef.current.createPriceLine({
        price: line.price,
        color: line.type === 'takeProfit' ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lineStyle: 0,
        title: `${line.type === 'takeProfit' ? 'TP' : 'SL'} $${line.price.toLocaleString()}`,
      })
      priceLineRefs.current.set(line.id, pl)
    }
  }, [lines, chartReady])

  return (
    <div className="flex flex-col h-full">
      {/* Timeframe tabs */}
      <div className="flex gap-1 mb-2 px-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              timeframe === tf
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 w-full rounded-xl overflow-hidden" />
    </div>
  )
}
