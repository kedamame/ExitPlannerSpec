import { NextRequest, NextResponse } from 'next/server'

const COIN_ID_RE = /^[a-z0-9-]{1,64}$/
// Note: in-memory cache is ineffective in serverless/Edge environments.
// For production, replace with Next.js fetch revalidate or an external cache (KV/Redis).
const cache = new Map<string, { price: number; ts: number }>()
const CACHE_TTL = 30000 // 30s

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const { coinId } = await params

  if (!COIN_ID_RE.test(coinId)) {
    return NextResponse.json({ error: 'invalid coinId' }, { status: 400 })
  }

  const now = Date.now()
  const cached = cache.get(coinId)
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ price: cached.price })
  }

  const apiKey = process.env.COINGECKO_API_KEY
  const headers: HeadersInit = {}
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: res.status })
    }
    const data = await res.json()
    const price: number = data[coinId]?.usd ?? 0
    cache.set(coinId, { price, ts: now })
    return NextResponse.json({ price })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
