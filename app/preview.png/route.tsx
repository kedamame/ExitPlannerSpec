import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

// Farcaster mini app embed requires 3:2 aspect ratio (1200×800)
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 800,
          background: '#080818',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top section: title + subtitle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 80,
            paddingBottom: 48,
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', fontSize: 88, fontWeight: 900, color: 'white', letterSpacing: -3 }}>
            Exit Planner
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#8888bb', letterSpacing: 1 }}>
            Set TP / SL lines on any crypto chart
          </div>
        </div>

        {/* Chart mockup */}
        <div
          style={{
            flex: 1,
            marginLeft: 80,
            marginRight: 80,
            marginBottom: 60,
            background: '#0d0d22',
            borderRadius: 16,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* TP line */}
          <div style={{
            position: 'absolute',
            top: 90,
            left: 0,
            right: 0,
            height: 2,
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              background: '#22c55e',
              color: '#000',
              fontSize: 15,
              fontWeight: 800,
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              marginLeft: 16,
              marginTop: 4,
            }}>
              TP $110,000
            </div>
          </div>

          {/* Price center */}
          <div style={{
            position: 'absolute',
            top: 160,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{ display: 'flex', fontSize: 15, color: '#4a4a70', letterSpacing: 4 }}>BTC / USD</div>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, color: '#fbbf24' }}>$100,000</div>
          </div>

          {/* SL line */}
          <div style={{
            position: 'absolute',
            top: 310,
            left: 0,
            right: 0,
            height: 2,
            background: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              background: '#ef4444',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 6,
              marginLeft: 16,
              marginTop: 4,
            }}>
              SL $90,000
            </div>
          </div>

          {/* Candlesticks */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 220,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
          }}>
            {([
              [80, true], [65, false], [100, true], [58, false],
              [115, true], [88, true], [72, false], [130, true],
              [95, false], [145, true], [110, true], [128, false],
              [160, true], [135, true], [150, true], [170, true],
              [142, false], [155, true],
            ] as [number, boolean][]).map(([h, up], i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 3,
                  background: up ? '#22c55e' : '#ef4444',
                  opacity: 0.75,
                }}
              />
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          paddingBottom: 56,
        }}>
          {['📈 Chart', '🎯 TP / SL', '🔔 Alerts', '🚀 Share'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                background: 'rgba(124,58,237,0.25)',
                color: '#c084fc',
                fontSize: 20,
                fontWeight: 600,
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 100,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 800 },
  )
}
