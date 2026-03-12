import type { OHLCData, TimeframeConfig } from '@/types'

const BASE_URL = 'https://api.coingecko.com/api/v3'

export const TIMEFRAME_CONFIGS: TimeframeConfig[] = [
  { label: '1H', days: '1', interval: 'hourly' },
  { label: '4H', days: '7', interval: 'hourly' },
  { label: '1D', days: '90', interval: 'daily' },
  { label: '1W', days: '365', interval: 'daily' },
  { label: '1M', days: 'max', interval: 'monthly' },
]

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY
  }
  return headers
}

export async function searchCoins(query: string) {
  const res = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`, {
    headers: buildHeaders(),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error('CoinGecko search failed')
  const data = await res.json()
  return data.coins as Array<{ id: string; name: string; symbol: string; thumb: string }>
}

export async function getOHLC(coinId: string, days: string): Promise<OHLCData[]> {
  const res = await fetch(
    `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
    { headers: buildHeaders(), next: { revalidate: 60 } }
  )
  if (!res.ok) throw new Error('CoinGecko OHLC failed')
  const raw: number[][] = await res.json()
  return raw.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000),
    open,
    high,
    low,
    close,
  }))
}

export async function getCurrentPrice(coinId: string): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd`,
    { headers: buildHeaders(), next: { revalidate: 30 } }
  )
  if (!res.ok) throw new Error('CoinGecko price failed')
  const data = await res.json()
  return data[coinId]?.usd ?? 0
}

export function filterOHLCByTimeframe(data: OHLCData[], timeframe: string): OHLCData[] {
  if (timeframe === '4H') {
    // Keep every 4th candle from hourly data
    return data.filter((_, i) => i % 4 === 0)
  }
  if (timeframe === '1W') {
    // Keep every 7th candle from daily data
    return data.filter((_, i) => i % 7 === 0)
  }
  return data
}
