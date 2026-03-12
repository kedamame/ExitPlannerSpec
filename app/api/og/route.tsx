import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SAFE_TEXT_RE = /^[\w\s\-.()#$%&@!?:,]{1,64}$/
const COIN_ID_RE = /^[a-z0-9-]{1,64}$/

function sanitizeText(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  return SAFE_TEXT_RE.test(raw) ? raw : fallback
}

function sanitizePrices(raw: string, limit = 10): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .filter(Boolean)
    .slice(0, limit)
    .filter((s) => {
      const n = parseFloat(s)
      return isFinite(n) && n > 0
    })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const coinName = sanitizeText(searchParams.get('coinName'), 'Unknown')
  const coinSymbol = sanitizeText(searchParams.get('coinSymbol'), 'N/A')
  const priceRaw = parseFloat(searchParams.get('price') ?? '0')
  const price = isFinite(priceRaw) && priceRaw >= 0 ? priceRaw.toString() : '0'
  const tpPrices = sanitizePrices(searchParams.get('tp') ?? '')
  const slPrices = sanitizePrices(searchParams.get('sl') ?? '')

  // Validate coinId format if provided (used in URL path context)
  const coinIdParam = searchParams.get('coinId')
  if (coinIdParam && !COIN_ID_RE.test(coinIdParam)) {
    return new Response('Bad Request', { status: 400 })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              background: '#7c3aed',
              borderRadius: '12px',
              padding: '8px 20px',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: '20px',
            }}
          >
            Exit Planner
          </div>
          <div style={{ fontSize: '16px', color: '#a0a0c0' }}>Farcaster MiniApp</div>
        </div>

        {/* Coin info */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '40px' }}>
          <span style={{ fontSize: '64px', fontWeight: 'bold', marginRight: '20px' }}>
            {coinSymbol}
          </span>
          <span style={{ fontSize: '32px', color: '#a0a0c0' }}>{coinName}</span>
        </div>

        {/* Current price */}
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '50px' }}>
          ${Number(price).toLocaleString()}
        </div>

        {/* Lines */}
        <div style={{ display: 'flex', gap: '60px' }}>
          {/* TP */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#22c55e',
                marginBottom: '16px',
                borderBottom: '2px solid #22c55e',
                paddingBottom: '8px',
              }}
            >
              ✅ Take Profit
            </div>
            {tpPrices.length > 0 ? (
              tpPrices.map((p, i) => (
                <div key={i} style={{ fontSize: '28px', color: '#86efac', marginBottom: '8px' }}>
                  ${Number(p).toLocaleString()}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '20px', color: '#4a4a6a' }}>—</div>
            )}
          </div>

          {/* SL */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ef4444',
                marginBottom: '16px',
                borderBottom: '2px solid #ef4444',
                paddingBottom: '8px',
              }}
            >
              🛑 Stop Loss
            </div>
            {slPrices.length > 0 ? (
              slPrices.map((p, i) => (
                <div key={i} style={{ fontSize: '28px', color: '#fca5a5', marginBottom: '8px' }}>
                  ${Number(p).toLocaleString()}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '20px', color: '#4a4a6a' }}>—</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '16px',
            color: '#4a4a6a',
          }}
        >
          #ExitPlanner
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
