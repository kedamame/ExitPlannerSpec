import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SAFE_TEXT_RE = /^[\w\s\-.()#$%&@!?:,]{1,64}$/
const COIN_ID_RE   = /^[a-z0-9-]{1,64}$/
const NUM_RE       = /^[\d.,]{1,80}$/

function sanitizeText(raw: string | null, fallback: string) {
  if (!raw) return fallback
  return SAFE_TEXT_RE.test(raw) ? raw : fallback
}
function sanitizePrices(raw: string | null, limit = 5): number[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean).slice(0, limit)
    .map((s) => parseFloat(s)).filter((n) => isFinite(n) && n > 0)
}
function pct(a: number, b: number) {
  const v = ((a - b) / b) * 100
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}
function fmt(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return '$' + n.toLocaleString()
  if (n >= 1)         return '$' + n.toFixed(2)
  return '$' + n.toPrecision(4)
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const coinIdParam = sp.get('coinId') ?? ''
  if (coinIdParam && !COIN_ID_RE.test(coinIdParam)) {
    return new Response('Bad Request', { status: 400 })
  }

  const coinSymbol = sanitizeText(sp.get('coinSymbol'), '???')
  const coinName   = sanitizeText(sp.get('coinName'),   'Unknown')
  const priceRaw   = parseFloat(sp.get('price') ?? '0')
  const price      = isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 0

  const rawTp = NUM_RE.test(sp.get('tp') ?? '') ? sp.get('tp')! : ''
  const rawSl = NUM_RE.test(sp.get('sl') ?? '') ? sp.get('sl')! : ''
  const tpList = sanitizePrices(rawTp)
  const slList = sanitizePrices(rawSl)

  // ── Price scale geometry ────────────────────────────────────────
  const W = 1200, H = 630
  const SCALE_X = 520   // left edge of scale bar
  const SCALE_W = 48    // width of the colored bar
  const SCALE_TOP = 80, SCALE_BOT = H - 80
  const SCALE_H = SCALE_BOT - SCALE_TOP

  const allPrices = [...tpList, ...slList, price].filter((p) => p > 0)
  let lo = Math.min(...allPrices), hi = Math.max(...allPrices)
  if (lo === hi) { lo = price * 0.85; hi = price * 1.15 }
  const pad = (hi - lo) * 0.18
  lo -= pad; hi += pad

  const py = (p: number) => SCALE_TOP + SCALE_H - ((p - lo) / (hi - lo)) * SCALE_H

  // current price Y
  const curY = price > 0 ? py(price) : (SCALE_TOP + SCALE_BOT) / 2

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H,
        background: '#080818',
        display: 'flex',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>

        {/* ── Left info panel ── */}
        <div style={{
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 56,
          paddingRight: 32,
          gap: 18,
        }}>
          {/* Badge */}
          <div style={{
            display: 'flex',
            background: '#7c3aed',
            borderRadius: 10,
            paddingLeft: 16, paddingRight: 16,
            paddingTop: 6, paddingBottom: 6,
            fontSize: 16, fontWeight: 700, color: 'white',
            width: 'fit-content',
          }}>
            Exit Planner
          </div>

          {/* Symbol + name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: 'white', lineHeight: 1 }}>
              {coinSymbol}
            </span>
            <span style={{ fontSize: 20, color: '#6666aa' }}>{coinName}</span>
          </div>

          {/* Current price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: '#4a4a70', letterSpacing: 2 }}>CURRENT PRICE</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#fbbf24' }}>
              {price > 0 ? fmt(price) : '—'}
            </span>
          </div>

          {/* TP summary */}
          {tpList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tpList.slice(0, 3).map((tp, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e' }} />
                  <span style={{ fontSize: 22, color: '#86efac', fontWeight: 700 }}>{fmt(tp)}</span>
                  <span style={{ fontSize: 15, color: '#22c55e' }}>{price > 0 ? pct(tp, price) : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* SL summary */}
          {slList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slList.slice(0, 3).map((sl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444' }} />
                  <span style={{ fontSize: 22, color: '#fca5a5', fontWeight: 700 }}>{fmt(sl)}</span>
                  <span style={{ fontSize: 15, color: '#ef4444' }}>{price > 0 ? pct(sl, price) : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hashtag */}
          <span style={{ fontSize: 14, color: '#2a2a48', marginTop: 4 }}>#ExitPlanner</span>
        </div>

        {/* ── Right: SVG price scale ── */}
        <svg
          width={W - 480}
          height={H}
          viewBox={`0 0 ${W - 480} ${H}`}
          style={{ display: 'block', position: 'absolute', left: 480, top: 0 }}
        >
          {/* Background */}
          <rect x="0" y="0" width={W - 480} height={H} fill="#0d0d20" />

          {/* Profit zone (current → TP max) */}
          {tpList.length > 0 && price > 0 && (
            <rect
              x={SCALE_X - 480} y={py(Math.max(...tpList)) - SCALE_TOP + SCALE_TOP}
              width={SCALE_W}
              height={curY - (py(Math.max(...tpList)) - SCALE_TOP + SCALE_TOP)}
              fill="#22c55e"
              opacity="0.25"
            />
          )}

          {/* Loss zone (SL min → current) */}
          {slList.length > 0 && price > 0 && (
            <rect
              x={SCALE_X - 480} y={curY}
              width={SCALE_W}
              height={(py(Math.min(...slList)) - SCALE_TOP + SCALE_TOP) - curY}
              fill="#ef4444"
              opacity="0.25"
            />
          )}

          {/* Scale bar outline */}
          <rect
            x={SCALE_X - 480} y={SCALE_TOP}
            width={SCALE_W} height={SCALE_H}
            fill="none" stroke="#2a2a48" strokeWidth="1"
            rx="4"
          />

          {/* TP lines */}
          {tpList.map((tp, i) => {
            const y = py(tp) - SCALE_TOP + SCALE_TOP
            const labelX = SCALE_X - 480 + SCALE_W + 16
            return (
              <g key={i}>
                <line x1={SCALE_X - 480 - 200} y1={y} x2={SCALE_X - 480 + SCALE_W + 360} y2={y}
                  stroke="#22c55e" strokeWidth="2" opacity="0.5" />
                <line x1={SCALE_X - 480} y1={y} x2={SCALE_X - 480 + SCALE_W} y2={y}
                  stroke="#22c55e" strokeWidth="3" />
                {/* Label box */}
                <rect x={labelX} y={y - 14} width={200} height={28} rx={5} fill="#166534" opacity="0.9" />
                <rect x={labelX} y={y - 14} width={4} height={28} rx={2} fill="#22c55e" />
              </g>
            )
          })}

          {/* SL lines */}
          {slList.map((sl, i) => {
            const y = py(sl) - SCALE_TOP + SCALE_TOP
            const labelX = SCALE_X - 480 + SCALE_W + 16
            return (
              <g key={i}>
                <line x1={SCALE_X - 480 - 200} y1={y} x2={SCALE_X - 480 + SCALE_W + 360} y2={y}
                  stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                <line x1={SCALE_X - 480} y1={y} x2={SCALE_X - 480 + SCALE_W} y2={y}
                  stroke="#ef4444" strokeWidth="3" />
                {/* Label box */}
                <rect x={labelX} y={y - 14} width={200} height={28} rx={5} fill="#7f1d1d" opacity="0.9" />
                <rect x={labelX} y={y - 14} width={4} height={28} rx={2} fill="#ef4444" />
              </g>
            )
          })}

          {/* Current price line */}
          {price > 0 && (
            <g>
              <line x1={SCALE_X - 480 - 200} y1={curY} x2={SCALE_X - 480 + SCALE_W + 360} y2={curY}
                stroke="#fbbf24" strokeWidth="2" strokeDasharray="10,5" opacity="0.8" />
              <circle cx={SCALE_X - 480 + SCALE_W / 2} cy={curY} r="7" fill="#fbbf24" />
            </g>
          )}
        </svg>

        {/* ── SVG label text overlaid as divs ── */}
        {tpList.map((tp, i) => {
          const y = py(tp)
          const labelX = SCALE_X + SCALE_W + 16 + 4 + 8
          return (
            <div key={i} style={{
              position: 'absolute',
              left: labelX,
              top: y - 10,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#86efac' }}>{fmt(tp)}</span>
              <span style={{ fontSize: 13, color: '#22c55e' }}>{price > 0 ? pct(tp, price) : ''}</span>
            </div>
          )
        })}
        {slList.map((sl, i) => {
          const y = py(sl)
          const labelX = SCALE_X + SCALE_W + 16 + 4 + 8
          return (
            <div key={i} style={{
              position: 'absolute',
              left: labelX,
              top: y - 10,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fca5a5' }}>{fmt(sl)}</span>
              <span style={{ fontSize: 13, color: '#ef4444' }}>{price > 0 ? pct(sl, price) : ''}</span>
            </div>
          )
        })}
        {price > 0 && (
          <div style={{
            position: 'absolute',
            left: SCALE_X + SCALE_W + 16 + 4 + 8,
            top: curY - 10,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{fmt(price)}</span>
            <span style={{ fontSize: 13, color: '#a16207' }}>NOW</span>
          </div>
        )}

      </div>
    ),
    { width: W, height: H }
  )
}
