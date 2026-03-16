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
            paddingLeft: 80,
            paddingRight: 40,
            gap: 18,
          }}
        >
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontSize: 78, fontWeight: 900, color: 'white', letterSpacing: -2, lineHeight: 1.05 }}>
              Exit
            </span>
            <span style={{ fontSize: 78, fontWeight: 900, color: 'white', letterSpacing: -2, lineHeight: 1.05 }}>
              Planner
            </span>
          </div>

          {/* Subtitle */}
          <div style={{ display: 'flex', fontSize: 21, color: '#7878a8' }}>
            Crypto TP / SL strategy tool
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            {[
              '📈  Candlestick Chart',
              '🎯  Take Profit & Stop Loss',
              '🔔  Price Alerts',
              '🚀  Share on Farcaster',
            ].map((label) => (
              <div key={label} style={{ display: 'flex', fontSize: 19, color: '#b0b0d0' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 1,
          display: 'flex',
          background: 'rgba(124,58,237,0.5)',
        }} />

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0d0d22',
            position: 'relative',
          }}
        >
          {/* TP line */}
          <div style={{
            position: 'absolute',
            top: 110,
            left: 0,
            right: 0,
            height: 1,
            background: '#22c55e',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              background: '#22c55e',
              color: '#000',
              fontSize: 13,
              fontWeight: 800,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 5,
              marginRight: 14,
              marginTop: 4,
            }}>
              TP $110,000
            </div>
          </div>

          {/* Price label */}
          <div style={{
            position: 'absolute',
            top: 220,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{ display: 'flex', fontSize: 14, color: '#505070', letterSpacing: 3 }}>BTC / USD</div>
            <div style={{ display: 'flex', fontSize: 42, fontWeight: 800, color: '#fbbf24' }}>$100,000</div>
          </div>

          {/* SL line */}
          <div style={{
            position: 'absolute',
            top: 420,
            left: 0,
            right: 0,
            height: 1,
            background: '#ef4444',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              background: '#ef4444',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              paddingTop: 3,
              paddingBottom: 3,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 5,
              marginRight: 14,
              marginTop: 4,
            }}>
              SL $90,000
            </div>
          </div>

          {/* Candlesticks */}
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            height: 300,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 7,
          }}>
            {([
              [120, true], [100, false], [150, true], [90, false],
              [165, true], [130, true], [110, false], [185, true],
              [145, false], [200, true], [165, true], [180, false],
              [220, true], [195, true], [210, true],
            ] as [number, boolean][]).map(([h, up], i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 3,
                  background: up ? '#22c55e' : '#ef4444',
                  opacity: 0.72,
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
