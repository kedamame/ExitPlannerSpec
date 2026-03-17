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
    lines: 'Lines',
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
    addLine: '+ ライン追加',
    takeProfit: '利確ライン',
    stopLoss: '損切りライン',
    share: 'castで共有',
    noLines: 'ラインなし',
    back: '← 戻る',
    lines: 'ライン',
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
  const [bottomOpen, setBottomOpen] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ name: coinId, symbol: '' })

  const t = messages[locale] ?? messages.en
  const { price, loading: priceLoading } = useCurrentPrice(coinId)
  const { data: ohlcData, loading: ohlcLoading } = useOHLC(coinId, timeframe)

  const position = positions.find((p) => p.coinId === coinId)
  const lines: PriceLine[] = position?.lines ?? []

  usePriceAlert(coinInfo.name, price, lines, alertEnabled as boolean, locale)

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
        return [...prev, {
          id: uuidv4(), coinId,
          coinSymbol: coinInfo.symbol, coinName: coinInfo.name,
          chain: 'ethereum', lines: [newLine],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }]
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

  const handleAlertToggle = async () => {
    if (!alertEnabled) {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }
    setAlertEnabled(!alertEnabled)
  }

  const currentPosition: Position = useMemo(
    () => position ?? {
      id: `temp-${coinId}`, coinId,
      coinSymbol: coinInfo.symbol, coinName: coinInfo.name,
      chain: 'ethereum', lines: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    [position, coinId, coinInfo.symbol, coinInfo.name]
  )

  const tpCount = lines.filter((l) => l.type === 'takeProfit').length
  const slCount = lines.filter((l) => l.type === 'stopLoss').length

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            {t.back}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{coinInfo.symbol || coinId.toUpperCase()}</span>
            <span className="text-gray-500 text-xs hidden sm:inline">{coinInfo.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">
            {priceLoading ? '...' : `$${price.toLocaleString()}`}
          </span>
          <button
            onClick={handleAlertToggle}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
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

      {/* ── Mobile layout (default): chart full width + bottom panel ── */}
      <div className="flex-1 flex flex-col sm:hidden overflow-hidden">
        {/* Chart — takes remaining height */}
        <div className="flex-1 min-h-0 p-2">
          {ohlcLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">Loading chart...</div>
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

        {/* Bottom panel */}
        <div className="shrink-0 border-t border-gray-800 bg-gray-950">
          {/* Always-visible toolbar */}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Lines summary — tap to expand */}
            <button
              onClick={() => setBottomOpen((o) => !o)}
              className="flex items-center gap-1.5 flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition"
            >
              <span className="text-white text-sm font-medium">{t.lines}</span>
              {tpCount > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">
                  TP×{tpCount}
                </span>
              )}
              {slCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                  SL×{slCount}
                </span>
              )}
              <span className="ml-auto text-gray-500 text-xs">{bottomOpen ? '▼' : '▲'}</span>
            </button>

            {/* Add line */}
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition shrink-0"
            >
              {t.addLine}
            </button>

            {/* Share */}
            <ShareButton
              position={currentPosition}
              currentPrice={price}
              locale={locale}
              label="Share"
              compact
            />
          </div>

          {/* Expandable lines list */}
          {bottomOpen && (
            <div className="px-3 pb-3 max-h-48 overflow-y-auto border-t border-gray-800">
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
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop layout (sm+): chart + side panel ── */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-3 min-w-0">
          {ohlcLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">Loading chart...</div>
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
        <aside className="w-56 border-l border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
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
