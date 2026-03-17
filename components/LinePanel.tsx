'use client'

import type { PriceLine } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

interface Props {
  lines: PriceLine[]
  onRemove: (id: string) => void
  onAddClick: () => void
  compact?: boolean
  labels?: {
    takeProfit: string
    stopLoss: string
    addLine: string
    noLines: string
  }
}

export function LinePanel({ lines, onRemove, onAddClick, compact, labels }: Props) {
  const l = labels ?? {
    takeProfit: 'Take Profit Lines',
    stopLoss: 'Stop Loss Lines',
    addLine: '+ Add Line',
    noLines: 'No lines',
  }

  const tpLines = lines.filter((line) => line.type === 'takeProfit')
  const slLines = lines.filter((line) => line.type === 'stopLoss')

  const renderLines = (items: PriceLine[], color: 'green' | 'red') =>
    items.length === 0 ? (
      <p className="text-xs text-gray-600 pl-5">{l.noLines}</p>
    ) : (
      <ul className={`space-y-1 ${compact ? '' : 'pl-5'}`}>
        {items.map((line) => (
          <li key={line.id} className="flex items-center justify-between group">
            <span className={`text-sm ${color === 'green' ? 'text-green-300' : 'text-red-300'}`}>
              {formatPrice(line.price)}
            </span>
            <button
              onClick={() => onRemove(line.id)}
              className="text-gray-600 hover:text-red-400 transition text-xs px-1"
              aria-label="Remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    )

  return (
    <div className={`flex flex-col w-full ${compact ? 'gap-3 pt-2' : 'gap-4'}`}>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-400">{l.takeProfit}</span>
        </div>
        {renderLines(tpLines, 'green')}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-red-400">{l.stopLoss}</span>
        </div>
        {renderLines(slLines, 'red')}
      </div>

      {!compact && (
        <button
          onClick={onAddClick}
          className="mt-2 w-full py-2 rounded-xl border border-dashed border-gray-600 hover:border-purple-500 text-gray-500 hover:text-purple-400 text-sm transition"
        >
          {l.addLine}
        </button>
      )}
    </div>
  )
}
