import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { data: Record<string, number>; ts: number }>()
const CACHE_TTL = 30000
const COIN_ID_RE = /^[a-z0-9-]{1,64}$/

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids') ?? ''
  if (!idsParam) return NextResponse.json({})

  const ids = idsParam
    .split(',')
    .filter(Boolean)
    .filter((id) => COIN_ID_RE.test(id))
    .slice(0, 20)

  if (ids.length === 0) return NextResponse.json({})

  const cacheKey = ids.sort().join(',')
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
      { headers }
    )
    if (!res.ok) return NextResponse.json({}, { status: res.status })
    const raw = await res.json()
    const result: Record<string, number> = {}
    for (const id of ids) {
      if (raw[id]?.usd) result[id] = raw[id].usd
    }
    cache.set(cacheKey, { data: result, ts: now })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
