import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 30000

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  if (!query) return NextResponse.json({ coins: [] })

  const cacheKey = query.toLowerCase()
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ coins: cached.data })
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      { headers }
    )
    if (!res.ok) return NextResponse.json({ coins: [] }, { status: res.status })
    const data = await res.json()
    const coins = data.coins?.slice(0, 10) ?? []
    cache.set(cacheKey, { data: coins, ts: now })
    return NextResponse.json({ coins })
  } catch {
    return NextResponse.json({ coins: [] }, { status: 500 })
  }
}
