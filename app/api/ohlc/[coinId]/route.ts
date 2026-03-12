import { NextRequest, NextResponse } from 'next/server'
import { filterOHLCByTimeframe } from '@/lib/coingecko'
import type { OHLCData } from '@/types'

const COIN_ID_RE = /^[a-z0-9-]{1,64}$/
const VALID_DAYS = new Set(['1', '7', '14', '30', '90', '365', 'max'])
// Note: in-memory cache is ineffective in serverless/Edge environments.
// For production, replace with Next.js fetch revalidate or an external cache (KV/Redis).
const cache = new Map<string, { data: OHLCData[]; ts: number }>()
const CACHE_TTL = 60000 // 60s

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const { coinId } = await params

  if (!COIN_ID_RE.test(coinId)) {
    return NextResponse.json({ error: 'invalid coinId' }, { status: 400 })
  }

  const searchParams = req.nextUrl.searchParams
  const daysParam = searchParams.get('days') ?? '1'
  const days = VALID_DAYS.has(daysParam) ? daysParam : '1'
  const timeframe = searchParams.get('timeframe') ?? '1H'
  const cacheKey = `${coinId}-${days}-${timeframe}`

  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ data: cached.data })
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { headers }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: res.status })
    }
    const raw: number[][] = await res.json()
    const parsed: OHLCData[] = raw.map(([time, open, high, low, close]) => ({
      time: Math.floor(time / 1000),
      open,
      high,
      low,
      close,
    }))
    const filtered = filterOHLCByTimeframe(parsed, timeframe)
    cache.set(cacheKey, { data: filtered, ts: now })
    return NextResponse.json({ data: filtered })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
