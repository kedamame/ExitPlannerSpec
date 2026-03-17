import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SAFE_TEXT_RE = /^[\w\s\-.()#$%&@!?:,]{1,64}$/
const COIN_ID_RE   = /^[a-z0-9-]{1,64}$/

function sanitizeText(raw: string | null, fallback: string) {
  if (!raw) return fallback
  return SAFE_TEXT_RE.test(raw) ? raw : fallback
}
function sanitizePrices(raw: string | null, limit = 5): number[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean).slice(0, limit)
    .map(Number).filter((n) => isFinite(n) && n > 0)
}
function fmt(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return '$' + Math.round(n).toLocaleString()
  if (n >= 1) {
    // Keep up to 4 decimal places, strip trailing zeros, min 2dp
    const s = n.toFixed(4).replace(/0+$/, '')
    const dp = s.includes('.') ? s.split('.')[1].length : 0
    return '$' + n.toFixed(Math.max(2, dp))
  }
  return '$' + n.toPrecision(4)
}
function pct(a: number, base: number) {
  const v = ((a - base) / base) * 100
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const coinIdParam = sp.get('coinId') ?? ''
  if (coinIdParam && !COIN_ID_RE.test(coinIdParam)) {
    return new Response('Bad Request', { status: 400 })
  }

  // Fallback symbol: derive from coinId if not provided (e.g. "bitcoin" → "BITCOIN")
  const symbolFallback = coinIdParam
    ? coinIdParam.split('-')[0].toUpperCase().slice(0, 8)
    : '???'
  const coinSymbol = sanitizeText(sp.get('coinSymbol'), symbolFallback) || symbolFallback
  const coinName   = sanitizeText(sp.get('coinName'),   coinIdParam || 'Unknown')
  const priceRaw   = parseFloat(sp.get('price') ?? '0')
  const price      = isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 0
  const tpList     = sanitizePrices(sp.get('tp')).sort((a, b) => b - a)
  const slList     = sanitizePrices(sp.get('sl')).sort((a, b) => b - a)

  const chainRaw = sp.get('chain') ?? ''
  const chain = /^[a-z0-9]{1,20}$/.test(chainRaw) ? chainRaw : ''
  const chainLabel = chain === 'base' ? 'Base' : chain === 'eth' ? 'ETH' : chain === 'solana' ? 'Solana' : chain ? chain.toUpperCase() : ''
  const chainColor = chain === 'base'   ? { bg: 'rgba(99,102,241,0.25)',  border: '#6366f1', text: '#a5b4fc' }
                   : chain === 'eth'    ? { bg: 'rgba(59,130,246,0.25)',  border: '#3b82f6', text: '#93c5fd' }
                   : chain === 'solana' ? { bg: 'rgba(168,85,247,0.25)',  border: '#a855f7', text: '#d8b4fe' }
                   : null

  // All price levels sorted high → low
  type Level = { price: number; type: 'tp' | 'current' | 'sl' }
  const levels: Level[] = [
    ...tpList.map((p) => ({ price: p, type: 'tp' as const })),
    ...(price > 0 ? [{ price, type: 'current' as const }] : []),
    ...slList.map((p) => ({ price: p, type: 'sl' as const })),
  ].sort((a, b) => b.price - a.price)

  // Price range for bar scaling
  const allPrices = levels.map((l) => l.price)
  const lo = allPrices.length ? Math.min(...allPrices) : 0
  const hi = allPrices.length ? Math.max(...allPrices) : 1
  const range = hi === lo ? hi * 0.2 : hi - lo
  // Max bar width in px (full range = 380px)
  const BAR_MAX = 380
  const barPx = (p: number) => Math.round((Math.abs(p - price) / range) * BAR_MAX)

  const colors: Record<Level['type'], string> = {
    tp: '#22c55e',
    current: '#fbbf24',
    sl: '#ef4444',
  }
  const bgColors: Record<Level['type'], string> = {
    tp: 'rgba(34,197,94,0.15)',
    current: 'rgba(251,191,36,0.12)',
    sl: 'rgba(239,68,68,0.15)',
  }
  const textColors: Record<Level['type'], string> = {
    tp: '#86efac',
    current: '#fbbf24',
    sl: '#fca5a5',
  }
  const labelText: Record<Level['type'], string> = {
    tp: 'TP',
    current: 'NOW',
    sl: 'SL',
  }

  const img = new ImageResponse(
    (
      <div style={{
        width: 1200, height: 800,
        background: '#080818',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        paddingTop: 60,
        paddingBottom: 52,
        paddingLeft: 80,
        paddingRight: 80,
        gap: 36,
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              background: '#7c3aed', borderRadius: 10,
              paddingLeft: 18, paddingRight: 18, paddingTop: 7, paddingBottom: 7,
              fontSize: 18, fontWeight: 700, color: 'white',
            }}>
              Exit Planner
            </div>
            <span style={{ fontSize: 44, fontWeight: 900, color: 'white' }}>{coinSymbol}</span>
            {chainLabel && chainColor && (
              <div style={{
                display: 'flex',
                background: chainColor.bg,
                border: `1.5px solid ${chainColor.border}`,
                borderRadius: 8,
                paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4,
                fontSize: 16, fontWeight: 700, color: chainColor.text,
              }}>
                {chainLabel}
              </div>
            )}
            <span style={{ fontSize: 22, color: '#5555aa' }}>{coinName}</span>
          </div>
          {price > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 14, color: '#44446a', letterSpacing: 2 }}>CURRENT PRICE</span>
              <span style={{ fontSize: 38, fontWeight: 800, color: '#fbbf24' }}>{fmt(price)}</span>
            </div>
          )}
        </div>

        {/* ── Price level rows ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
        }}>
          {levels.length === 0 ? (
            <span style={{ fontSize: 22, color: '#3a3a5a' }}>No lines set</span>
          ) : (
            levels.map((level, i) => {
              const isAbove = level.price >= price
              const bw = price > 0 ? barPx(level.price) : 200
              const pctStr = price > 0 && level.type !== 'current' ? pct(level.price, price) : ''
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: bgColors[level.type],
                  borderRadius: 12,
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingTop: 14,
                  paddingBottom: 14,
                  gap: 0,
                }}>
                  {/* Left: label badge + price */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 320 }}>
                    <div style={{
                      display: 'flex',
                      background: colors[level.type],
                      color: level.type === 'tp' ? '#000' : '#fff',
                      fontSize: 14, fontWeight: 800,
                      paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4,
                      borderRadius: 8,
                      minWidth: 52,
                      justifyContent: 'center',
                    }}>
                      {labelText[level.type]}
                    </div>
                    <span style={{ fontSize: 28, fontWeight: 800, color: textColors[level.type] }}>
                      {fmt(level.price)}
                    </span>
                  </div>

                  {/* Center: horizontal bar */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: level.type === 'current' ? 'flex-start' : 'flex-start',
                    gap: 8,
                  }}>
                    {level.type !== 'current' ? (
                      <div style={{
                        height: 12,
                        width: bw,
                        background: `linear-gradient(to right, ${colors[level.type]}, ${colors[level.type]}44)`,
                        borderRadius: 6,
                        maxWidth: BAR_MAX,
                      }} />
                    ) : (
                      <div style={{
                        height: 3,
                        width: 240,
                        background: '#fbbf2466',
                        borderRadius: 2,
                      }} />
                    )}
                  </div>

                  {/* Right: % diff */}
                  <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
                    {pctStr ? (
                      <span style={{
                        fontSize: 20, fontWeight: 700,
                        color: isAbove ? '#4ade80' : '#f87171',
                      }}>
                        {pctStr}
                      </span>
                    ) : (
                      <span style={{ fontSize: 14, color: '#44446a' }}>current</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: '#2a2a48' }}>#ExitPlanner</span>
        </div>

      </div>
    ),
    { width: 1200, height: 800 }
  )
  img.headers.set('Cache-Control', 'no-store')
  return img
}
