'use client'

import type { PriceLine } from '@/types'

interface Props {
  lines: PriceLine[]
  onRemove: (id: string) => void
  onAddClick: () => void
  labels?: {
    takeProfit: string
    stopLoss: string
    addLine: string
    noLines: string
  }
}

export function LinePanel({ lines, onRemove, onAddClick, labels }: Props) {
  const l = labels ?? {
    takeProfit: 'Take Profit Lines',
    stopLoss: 'Stop Loss Lines',
    addLine: '+ Add Line',
    noLines: 'No lines',
  }

  const tpLines = lines.filter((l) => l.type === 'takeProfit')
  const slLines = lines.filter((l) => l.type === 'stopLoss')

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* TP Lines */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-400">{l.takeProfit}</span>
        </div>
        {tpLines.length === 0 ? (
          <p className="text-xs text-gray-600 pl-5">{l.noLines}</p>
        ) : (
          <ul className="space-y-1 pl-5">
            {tpLines.map((line) => (
              <li key={line.id} className="flex items-center justify-between group">
                <span className="text-sm text-green-300">${line.price.toLocaleString()}</span>
                <button
                  onClick={() => onRemove(line.id)}
                  className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-xs"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SL Lines */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-400">{l.stopLoss}</span>
        </div>
        {slLines.length === 0 ? (
          <p className="text-xs text-gray-600 pl-5">{l.noLines}</p>
        ) : (
          <ul className="space-y-1 pl-5">
            {slLines.map((line) => (
              <li key={line.id} className="flex items-center justify-between group">
                <span className="text-sm text-red-300">${line.price.toLocaleString()}</span>
                <button
                  onClick={() => onRemove(line.id)}
                  className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-xs"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onAddClick}
        className="mt-2 w-full py-2 rounded-xl border border-dashed border-gray-600 hover:border-purple-500 text-gray-500 hover:text-purple-400 text-sm transition"
      >
        {l.addLine}
      </button>
    </div>
  )
}
