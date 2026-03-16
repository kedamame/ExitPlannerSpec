import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a1a',
          display: 'flex',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: 560,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 64px',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 90, fontWeight: 900, color: 'white', letterSpacing: -3, lineHeight: 1, display: 'flex', flexDirection: 'column' }}>
            <span>Exit</span>
            <span>Planner</span>
          </div>

          <div style={{ fontSize: 22, color: '#8888aa', display: 'flex' }}>
            Crypto TP / SL strategy tool
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {[
              '📈  Candlestick Chart',
              '🎯  Take Profit & Stop Loss',
              '🔔  Price Alerts',
              '🚀  Share on Farcaster',
            ].map((label) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: '#c0c0e0' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0d0d22',
            borderLeftWidth: 1,
            borderLeftStyle: 'solid',
            borderLeftColor: 'rgba(124,58,237,0.4)',
            position: 'relative',
          }}
        >
          {/* Price centered */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 220,
            left: 0,
            right: 0,
          }}>
            <div style={{ fontSize: 15, color: '#555577', letterSpacing: 3, display: 'flex' }}>BTC / USD</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#fbbf24', marginTop: 6, display: 'flex' }}>$100,000</div>
          </div>

          {/* TP line */}
          <div style={{
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            height: 1,
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}>
            <div style={{
              background: '#22c55e',
              color: '#000',
              fontSize: 13,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 6,
              marginRight: 16,
              marginTop: -13,
              display: 'flex',
            }}>
              TP $110,000
            </div>
          </div>

          {/* SL line */}
          <div style={{
            position: 'absolute',
            top: 430,
            left: 0,
            right: 0,
            height: 1,
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}>
            <div style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 6,
              marginRight: 16,
              marginTop: -13,
              display: 'flex',
            }}>
              SL $90,000
            </div>
          </div>

          {/* Candlesticks */}
          <div style={{
            position: 'absolute',
            bottom: 30,
            left: 16,
            right: 16,
            height: 320,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 7,
          }}>
            {([
              [130, true], [110, false], [160, true], [100, false],
              [180, true], [140, true], [120, false], [200, true],
              [155, false], [220, true], [175, true], [195, false],
              [240, true], [210, true], [230, true],
            ] as [number, boolean][]).map(([h, up], i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 3,
                  background: up ? '#22c55e' : '#ef4444',
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
