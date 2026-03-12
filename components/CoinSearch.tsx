'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CoinSearchResult } from '@/types'

interface Props {
  placeholder?: string
}

export function CoinSearch({ placeholder = 'Enter ticker or contract address' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CoinSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.coins ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const select = (coin: CoinSearchResult) => {
    setOpen(false)
    setQuery('')
    router.push(`/chart/${coin.id}`)
  }

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          {results.map((coin) => (
            <li
              key={coin.id}
              onClick={() => select(coin)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer transition"
            >
              {coin.thumb && (
                <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
              )}
              <span className="font-medium text-white">{coin.symbol.toUpperCase()}</span>
              <span className="text-gray-400 text-sm flex-1">{coin.name}</span>
              {coin.platform && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
                  coin.platform === 'base'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-600/30'
                    : coin.platform === 'ethereum'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : coin.platform === 'binance-smart-chain'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : coin.platform === 'polygon-pos'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : coin.platform === 'arbitrum-one'
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                    : coin.platform === 'optimistic-ethereum'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                }`}>
                  {coin.platform === 'ethereum' ? 'Ethereum'
                    : coin.platform === 'base' ? 'Base'
                    : coin.platform === 'binance-smart-chain' ? 'BNB'
                    : coin.platform === 'polygon-pos' ? 'Polygon'
                    : coin.platform === 'arbitrum-one' ? 'Arbitrum'
                    : coin.platform === 'optimistic-ethereum' ? 'Optimism'
                    : coin.platform}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
