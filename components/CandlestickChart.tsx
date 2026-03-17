'use client'

import { useEffect, useRef, useState } from 'react'
import type { OHLCData, PriceLine, Timeframe } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

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
  addMode?: 'off' | 'tp' | 'sl'
  onChartAddLine?: (type: 'takeProfit' | 'stopLoss', price: number) => void
}

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M']

export function CandlestickChart({
  data,
  lines,
  currentPrice,
  timeframe,
  onTimeframeChange,
  addMode = 'off',
  onChartAddLine,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<LWChart>(null)
  const seriesRef = useRef<LWSeries>(null)
  const priceLineRefs = useRef<Map<string, LWSeries>>(new Map())
  const currentPriceLineRef = useRef<LWSeries>(null)
  const [chartReady, setChartReady] = useState(false)
  const [hoverPrice, setHoverPrice] = useState<number | null>(null)

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
      title: formatPrice(currentPrice),
    })
  }, [currentPrice, chartReady])

  // Crosshair move → track hover price for add-mode preview
  useEffect(() => {
    if (!chartReady || !chartRef.current || !seriesRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (param: any) => {
      if (!param.point || !seriesRef.current) { setHoverPrice(null); return }
      const price = seriesRef.current.coordinateToPrice(param.point.y)
      setHoverPrice(price !== null && price > 0 ? price : null)
    }

    chartRef.current.subscribeCrosshairMove(handler)
    return () => { chartRef.current?.unsubscribeCrosshairMove(handler) }
  }, [chartReady])

  // Chart click → add line at tapped price
  useEffect(() => {
    if (!chartReady || !chartRef.current || !seriesRef.current || addMode === 'off' || !onChartAddLine) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (param: any) => {
      if (!param.point || !seriesRef.current) return
      const price = seriesRef.current.coordinateToPrice(param.point.y)
      if (price === null || price <= 0) return
      // Round to 8 significant figures to avoid floating-point noise
      const mag = price > 0 ? Math.pow(10, 8 - Math.ceil(Math.log10(price))) : 1e8
      const rounded = Math.round(price * mag) / mag
      onChartAddLine(addMode === 'tp' ? 'takeProfit' : 'stopLoss', rounded)
    }

    chartRef.current.subscribeClick(handler)
    return () => { chartRef.current?.unsubscribeClick(handler) }
  }, [chartReady, addMode, onChartAddLine])

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
        title: `${line.type === 'takeProfit' ? 'TP' : 'SL'} ${formatPrice(line.price)}`,
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

      {/* Add-mode hint banner */}
      {addMode !== 'off' && (
        <div className={`flex items-center justify-between text-xs py-1.5 px-3 mb-1 rounded-lg font-medium ${
          addMode === 'tp'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <span>{addMode === 'tp' ? '📍 タップして利確ラインを追加' : '📍 タップして損切りラインを追加'}</span>
          {hoverPrice !== null && (
            <span className="font-bold tabular-nums">{formatPrice(hoverPrice)}</span>
          )}
        </div>
      )}

      {/* Chart container */}
      <div
        ref={containerRef}
        className="flex-1 w-full rounded-xl overflow-hidden"
        style={{ cursor: addMode !== 'off' ? 'crosshair' : 'default' }}
      />
    </div>
  )
}
