'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'
import { LinePanel } from '@/components/LinePanel'
import { AddLineModal } from '@/components/AddLineModal'
import { ShareButton } from '@/components/ShareButton'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useCurrentPrice, useOHLC } from '@/hooks/useCoinGecko'
import { usePriceAlert, requestNotificationPermission } from '@/hooks/usePriceAlert'
import type { Position, PriceLine, LineType, Timeframe } from '@/types'

// Dynamic import for chart (no SSR)
const CandlestickChart = dynamic(
  () => import('@/components/CandlestickChart').then((m) => m.CandlestickChart),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-gray-600">Loading chart...</div> }
)

const messages = {
  en: {
    currentPrice: 'Current Price',
    alertOn: 'Alert ON',
    alertOff: 'Alert OFF',
    addLine: '+ Add Line',
    takeProfit: 'Take Profit Lines',
    stopLoss: 'Stop Loss Lines',
    share: 'Share as Cast',
    noLines: 'No lines',
    back: '← Back',
    modal: {
      title: 'Add Line',
      type: 'Type',
      takeProfit: 'Take Profit',
      stopLoss: 'Stop Loss',
      price: 'Price (USD)',
      cancel: 'Cancel',
      add: 'Add',
    },
  },
  ja: {
    currentPrice: '現在価格',
    alertOn: 'アラートON',
    alertOff: 'アラートOFF',
    addLine: '+ ラインを追加',
    takeProfit: '利確ライン',
    stopLoss: '損切りライン',
    share: 'castで共有',
    noLines: 'ラインなし',
    back: '← 戻る',
    modal: {
      title: 'ラインを追加',
      type: '種別',
      takeProfit: '利確',
      stopLoss: '損切り',
      price: '価格 (USD)',
      cancel: 'キャンセル',
      add: '追加',
    },
  },
}

export default function ChartPage() {
  const params = useParams()
  const router = useRouter()
  const coinId = params.coinId as string

  const [locale] = useLocalStorage<'en' | 'ja'>('exit_planner_locale', 'en')
  const [positions, setPositions] = useLocalStorage<Position[]>('exit_planner_positions', [])
  const [alertEnabled, setAlertEnabled] = useLocalStorage<boolean>('exit_planner_alert', false)

  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [showModal, setShowModal] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ name: coinId, symbol: '' })

  const t = messages[locale] ?? messages.en
  const { price, loading: priceLoading } = useCurrentPrice(coinId)
  const { data: ohlcData, loading: ohlcLoading } = useOHLC(coinId, timeframe)

  // Find or create position
  const position = positions.find((p) => p.coinId === coinId)
  const lines: PriceLine[] = position?.lines ?? []

  // Price alert
  usePriceAlert(coinInfo.name, price, lines, alertEnabled as boolean, locale)

  // Fetch coin info
  useEffect(() => {
    fetch(`/api/search?q=${encodeURIComponent(coinId)}`)
      .then((r) => r.json())
      .then((data) => {
        const coin = data.coins?.find((c: { id: string; name: string; symbol: string }) => c.id === coinId)
        if (coin) setCoinInfo({ name: coin.name, symbol: coin.symbol.toUpperCase() })
      })
      .catch(() => {})
  }, [coinId])

  const addLine = useCallback(
    (type: LineType, linePrice: number) => {
      const newLine: PriceLine = { id: uuidv4(), type, price: linePrice }
      setPositions((prev: Position[]) => {
        const existing = prev.find((p) => p.coinId === coinId)
        if (existing) {
          return prev.map((p) =>
            p.coinId === coinId
              ? { ...p, lines: [...p.lines, newLine], updatedAt: new Date().toISOString() }
              : p
          )
        }
        const newPos: Position = {
          id: uuidv4(),
          coinId,
          coinSymbol: coinInfo.symbol,
          coinName: coinInfo.name,
          chain: 'ethereum',
          lines: [newLine],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return [...prev, newPos]
      })
    },
    [coinId, coinInfo, setPositions]
  )

  const removeLine = useCallback(
    (lineId: string) => {
      setPositions((prev: Position[]) =>
        prev.map((p) =>
          p.coinId === coinId
            ? { ...p, lines: p.lines.filter((l) => l.id !== lineId), updatedAt: new Date().toISOString() }
            : p
        )
      )
    },
    [coinId, setPositions]
  )

  const updateLinePrice = useCallback(
    (lineId: string, newPrice: number) => {
      setPositions((prev: Position[]) =>
        prev.map((p) =>
          p.coinId === coinId
            ? {
                ...p,
                lines: p.lines.map((l) => (l.id === lineId ? { ...l, price: newPrice } : l)),
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      )
    },
    [coinId, setPositions]
  )

  const handleAlertToggle = async () => {
    if (!alertEnabled) {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }
    setAlertEnabled(!alertEnabled)
  }

  const currentPosition: Position = useMemo(
    () =>
      position ?? {
        id: `temp-${coinId}`,
        coinId,
        coinSymbol: coinInfo.symbol,
        coinName: coinInfo.name,
        chain: 'ethereum',
        lines: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    [position, coinId, coinInfo.symbol, coinInfo.name]
  )

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            {t.back}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">
              {coinInfo.symbol || coinId.toUpperCase()}
            </span>
            <span className="text-gray-500 text-sm">{coinInfo.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Current price */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">{t.currentPrice}</span>
            <span className="text-yellow-400 font-bold text-sm">
              {priceLoading ? '...' : `$${price.toLocaleString()}`}
            </span>
          </div>
          {/* Alert toggle */}
          <button
            onClick={handleAlertToggle}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              alertEnabled
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/40'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            {alertEnabled ? t.alertOn : t.alertOff}
          </button>
          <LanguageToggle />
        </div>
      </header>

      {/* Mobile price bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-1.5 bg-gray-900 border-b border-gray-800">
        <span className="text-gray-500 text-xs">{t.currentPrice}</span>
        <span className="text-yellow-400 font-bold text-sm">
          {priceLoading ? '...' : `$${price.toLocaleString()}`}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 flex flex-col p-3 min-w-0">
          {ohlcLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              Loading chart...
            </div>
          ) : (
            <CandlestickChart
              data={ohlcData}
              lines={lines}
              currentPrice={price}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}
        </div>

        {/* Side panel */}
        <aside className="w-52 border-l border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <LinePanel
            lines={lines}
            onRemove={removeLine}
            onAddClick={() => setShowModal(true)}
            labels={{
              takeProfit: t.takeProfit,
              stopLoss: t.stopLoss,
              addLine: t.addLine,
              noLines: t.noLines,
            }}
          />
          <div className="mt-auto pt-4 border-t border-gray-800">
            <ShareButton
              position={currentPosition}
              currentPrice={price}
              locale={locale}
              label={t.share}
            />
          </div>
        </aside>
      </div>

      {/* Add line modal */}
      {showModal && (
        <AddLineModal
          onAdd={addLine}
          onClose={() => setShowModal(false)}
          currentPrice={price}
          labels={{
            title: t.modal.title,
            type: t.modal.type,
            takeProfit: t.modal.takeProfit,
            stopLoss: t.modal.stopLoss,
            price: t.modal.price,
            cancel: t.modal.cancel,
            add: t.modal.add,
          }}
        />
      )}
    </div>
  )
}
