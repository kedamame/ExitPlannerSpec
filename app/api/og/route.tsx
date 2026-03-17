import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SAFE_TEXT_RE = /^[\w\s\-.()#$%&@!?:,]{1,64}$/
const COIN_ID_RE = /^[a-z0-9-]{1,64}$/

function sanitizeText(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  return SAFE_TEXT_RE.test(raw) ? raw : fallback
}

function sanitizePrices(raw: string | null, limit = 5): number[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean).slice(0, limit)
    .map((s) => parseFloat(s)).filter((n) => isFinite(n) && n > 0)
}

interface Candle { open: number; high: number; low: number; close: number }

async function fetchOHLC(coinId: string): Promise<Candle[]> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=7`,
      { signal: controller.signal }
    )
    clearTimeout(t)
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return (data as number[][]).slice(-40).map(([, o, h, l, c]) => ({
      open: o, high: h, low: l, close: c,
    }))
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const coinIdParam = searchParams.get('coinId') ?? ''
  if (coinIdParam && !COIN_ID_RE.test(coinIdParam)) {
    return new Response('Bad Request', { status: 400 })
  }

  const coinName   = sanitizeText(searchParams.get('coinName'), 'Unknown')
  const coinSymbol = sanitizeText(searchParams.get('coinSymbol'), '???')
  const priceRaw   = parseFloat(searchParams.get('price') ?? '0')
  const price      = isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 0
  const tpPrices   = sanitizePrices(searchParams.get('tp'))
  const slPrices   = sanitizePrices(searchParams.get('sl'))

  const candles = coinIdParam ? await fetchOHLC(coinIdParam) : []

  // ── Chart geometry ────────────────────────────────────────────────
  const W = 1200, H = 630
  const HEADER = 80, FOOTER = 70
  const cY = HEADER               // chart top in full image
  const cH = H - HEADER - FOOTER  // chart height

  // Price range: include all candles + TP/SL + current price
  let lo = Infinity, hi = -Infinity
  for (const c of candles) { lo = Math.min(lo, c.low); hi = Math.max(hi, c.high) }
  for (const p of [...tpPrices, ...slPrices, price]) {
    if (p > 0) { lo = Math.min(lo, p); hi = Math.max(hi, p) }
  }
  if (!isFinite(lo) || !isFinite(hi) || lo === hi) {
    lo = price * 0.85; hi = price * 1.15
  }
  const pad = (hi - lo) * 0.12
  lo -= pad; hi += pad

  const py = (p: number) => cY + cH - ((p - lo) / (hi - lo)) * cH

  // Candle sizing
  const PAD_X = 20
  const n = candles.length
  const slotW = n > 0 ? (W - PAD_X * 2) / n : 0
  const bodyW = Math.max(4, Math.floor(slotW * 0.65))

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H,
        background: '#080818',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div style={{
          height: HEADER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 32,
          paddingRight: 32,
          borderBottom: '1px solid #1a1a30',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: '#7c3aed',
              borderRadius: 8,
              paddingLeft: 14, paddingRight: 14,
              paddingTop: 5, paddingBottom: 5,
              fontSize: 15, fontWeight: 700, color: 'white',
            }}>
              Exit Planner
            </div>
            <span style={{ fontSize: 30, fontWeight: 800, color: 'white' }}>{coinSymbol}</span>
            <span style={{ fontSize: 17, color: '#6666aa' }}>{coinName}</span>
          </div>
          <span style={{ fontSize: 34, fontWeight: 800, color: '#fbbf24' }}>
            ${price > 0 ? price.toLocaleString() : '—'}
          </span>
        </div>

        {/* ── Chart (SVG) ── */}
        <svg
          width={W}
          height={cH}
          viewBox={`0 0 ${W} ${cH}`}
          style={{ display: 'block', background: '#0d0d22' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((r) => (
            <line key={r}
              x1={0} y1={cH * r} x2={W} y2={cH * r}
              stroke="#1a1a30" strokeWidth="1"
            />
          ))}

          {/* Current price (dashed yellow) */}
          {price > 0 && (
            <line
              x1={0} y1={py(price) - cY}
              x2={W} y2={py(price) - cY}
              stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="8,4" opacity="0.7"
            />
          )}

          {/* TP lines */}
          {tpPrices.map((tp, i) => (
            <line key={i}
              x1={0} y1={py(tp) - cY}
              x2={W} y2={py(tp) - cY}
              stroke="#22c55e" strokeWidth="2"
            />
          ))}

          {/* SL lines */}
          {slPrices.map((sl, i) => (
            <line key={i}
              x1={0} y1={py(sl) - cY}
              x2={W} y2={py(sl) - cY}
              stroke="#ef4444" strokeWidth="2"
            />
          ))}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const cx = PAD_X + i * slotW + slotW / 2
            const yH = py(c.high) - cY
            const yL = py(c.low) - cY
            const y1 = py(Math.max(c.open, c.close)) - cY
            const y2 = py(Math.min(c.open, c.close)) - cY
            const up = c.close >= c.open
            const col = up ? '#22c55e' : '#ef4444'
            return (
              <g key={i}>
                <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={col} strokeWidth="1.5" />
                <rect
                  x={cx - bodyW / 2} y={y1}
                  width={bodyW} height={Math.max(1, y2 - y1)}
                  fill={col}
                />
              </g>
            )
          })}
        </svg>

        {/* ── TP/SL labels overlaid on chart ── */}
        {tpPrices.map((tp, i) => (
          <div key={i} style={{
            position: 'absolute',
            right: 8,
            top: py(tp) - 11,
            background: '#22c55e',
            color: '#000',
            fontSize: 12, fontWeight: 800,
            paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
            borderRadius: 4,
          }}>
            TP ${tp.toLocaleString()}
          </div>
        ))}
        {slPrices.map((sl, i) => (
          <div key={i} style={{
            position: 'absolute',
            right: 8,
            top: py(sl) - 11,
            background: '#ef4444',
            color: '#fff',
            fontSize: 12, fontWeight: 800,
            paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
            borderRadius: 4,
          }}>
            SL ${sl.toLocaleString()}
          </div>
        ))}

        {/* ── Footer ── */}
        <div style={{
          height: FOOTER,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          paddingLeft: 32,
          paddingRight: 32,
          borderTop: '1px solid #1a1a30',
        }}>
          {tpPrices.length > 0
            ? tpPrices.map((tp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e' }} />
                  <span style={{ fontSize: 18, color: '#86efac', fontWeight: 600 }}>TP ${tp.toLocaleString()}</span>
                </div>
              ))
            : <span style={{ fontSize: 15, color: '#3a3a5a' }}>No TP set</span>
          }
          <div style={{ width: 1, height: 28, background: '#2a2a40' }} />
          {slPrices.length > 0
            ? slPrices.map((sl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444' }} />
                  <span style={{ fontSize: 18, color: '#fca5a5', fontWeight: 600 }}>SL ${sl.toLocaleString()}</span>
                </div>
              ))
            : <span style={{ fontSize: 15, color: '#3a3a5a' }}>No SL set</span>
          }
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#2a2a48' }}>#ExitPlanner</span>
        </div>
      </div>
    ),
    { width: W, height: H }
  )
}
