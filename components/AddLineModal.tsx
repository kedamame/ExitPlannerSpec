'use client'

import { useState } from 'react'
import type { LineType } from '@/types'

interface Props {
  onAdd: (type: LineType, price: number) => void
  onClose: () => void
  currentPrice?: number
  labels?: {
    title: string
    type: string
    takeProfit: string
    stopLoss: string
    price: string
    cancel: string
    add: string
  }
}

export function AddLineModal({ onAdd, onClose, currentPrice, labels }: Props) {
  const [type, setType] = useState<LineType>('takeProfit')
  const [price, setPrice] = useState(currentPrice?.toString() ?? '')

  const l = labels ?? {
    title: 'Add Line',
    type: 'Type',
    takeProfit: 'Take Profit',
    stopLoss: 'Stop Loss',
    price: 'Price (USD)',
    cancel: 'Cancel',
    add: 'Add',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseFloat(price)
    if (isNaN(p) || p <= 0) return
    onAdd(type, p)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">{l.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">{l.type}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('takeProfit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  type === 'takeProfit'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {l.takeProfit}
              </button>
              <button
                type="button"
                onClick={() => setType('stopLoss')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  type === 'stopLoss'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {l.stopLoss}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{l.price}</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition"
            >
              {l.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition"
            >
              {l.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
