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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left: text content */}
        <div style={{
          width: 580,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 64px',
          zIndex: 2,
          gap: 24,
        }}>
          {/* Title */}
          <div style={{
            fontSize: 88,
            fontWeight: 900,
            color: 'white',
            letterSpacing: -3,
            lineHeight: 1,
          }}>
            Exit<br />Planner
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: 24,
            color: '#9090b8',
            lineHeight: 1.5,
          }}>
            Crypto TP / SL strategy tool
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              ['📈', 'Candlestick Chart'],
              ['🎯', 'Take Profit & Stop Loss Lines'],
              ['🔔', 'Price Alerts'],
              ['🚀', 'Share on Farcaster'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 20, color: '#c0c0e0' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: chart panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0d0d25 0%, #111130 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* TP label */}
          <div style={{
            position: 'absolute', top: 120, left: 0, right: 0,
            height: 1, background: '#22c55e', opacity: 0.8,
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute', right: 16, top: -13,
              background: '#22c55e', color: '#000',
              fontSize: 13, fontWeight: 800,
              padding: '3px 10px', borderRadius: 6,
            }}>
              TP $110,000
            </div>
          </div>

          {/* SL label */}
          <div style={{
            position: 'absolute', top: 430, left: 0, right: 0,
            height: 1, background: '#ef4444', opacity: 0.8,
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute', right: 16, top: -13,
              background: '#ef4444', color: '#fff',
              fontSize: 13, fontWeight: 800,
              padding: '3px 10px', borderRadius: 6,
            }}>
              SL $90,000
            </div>
          </div>

          {/* Horizontal grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((y) => (
            <div key={y} style={{
              position: 'absolute',
              top: y * 630,
              left: 0, right: 0,
              height: 1,
              background: 'rgba(255,255,255,0.05)',
            }} />
          ))}

          {/* Candlesticks */}
          <div style={{
            position: 'absolute',
            bottom: 40,
            left: 20,
            right: 20,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 340,
          }}>
            {[
              [160, true], [140, false], [190, true], [130, false],
              [210, true], [170, true], [150, false], [230, true],
              [180, false], [250, true], [200, true], [220, false],
              [270, true], [240, true], [260, true],
            ].map(([h, up], i) => (
              <div key={i} style={{
                flex: 1,
                height: h as number,
                borderRadius: 3,
                background: up ? '#22c55e' : '#ef4444',
                opacity: 0.75,
              }} />
            ))}
          </div>

          {/* Price label */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 14, color: '#606080', letterSpacing: 2 }}>BTC / USD</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
              $100,000
            </div>
          </div>
        </div>

        {/* Vertical divider glow */}
        <div style={{
          position: 'absolute',
          left: 580,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'linear-gradient(180deg, transparent, #7c3aed 50%, transparent)',
          opacity: 0.5,
        }} />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
