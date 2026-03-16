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
          background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f23 50%, #1a1040 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid lines */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-around', opacity: 0.06,
        }}>
          {[0,1,2,3,4].map((i) => (
            <div key={i} style={{ height: 1, background: '#ffffff', width: '100%' }} />
          ))}
        </div>

        {/* Mock candlesticks */}
        <div style={{
          position: 'absolute', bottom: 80, left: 60, right: 60,
          display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, opacity: 0.35,
        }}>
          {[120,90,140,80,160,110,180,130,200,150,170,220,160,240,190].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: h, borderRadius: 3,
              background: i % 3 === 0 ? '#ef4444' : '#22c55e',
            }} />
          ))}
        </div>

        {/* TP line (green) */}
        <div style={{
          position: 'absolute', top: 160, left: 60, right: 60,
          height: 2, background: '#22c55e', opacity: 0.6,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            background: '#22c55e', color: '#000', fontSize: 14, fontWeight: 700,
            padding: '2px 8px', borderRadius: 4, marginLeft: 'auto',
          }}>TP $110,000</div>
        </div>

        {/* SL line (red) */}
        <div style={{
          position: 'absolute', bottom: 290, left: 60, right: 60,
          height: 2, background: '#ef4444', opacity: 0.6,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700,
            padding: '2px 8px', borderRadius: 4, marginLeft: 'auto',
          }}>SL $90,000</div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            background: 'rgba(124,58,237,0.3)', border: '1px solid #7c3aed',
            borderRadius: 100, padding: '6px 20px',
            fontSize: 16, color: '#a78bfa', letterSpacing: 3,
          }}>
            FARCASTER MINIAPP
          </div>

          {/* Title */}
          <div style={{
            fontSize: 96, fontWeight: 900, color: 'white',
            letterSpacing: -4, lineHeight: 1,
          }}>
            Exit Planner
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: 28, color: '#8888aa', textAlign: 'center', maxWidth: 700,
          }}>
            Set TP / SL lines on any crypto chart
          </div>

          {/* Features */}
          <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
            {['📈 Candlestick Chart', '🎯 TP / SL Lines', '🔔 Price Alerts', '🚀 Share on Farcaster'].map((f) => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.07)', borderRadius: 12,
                padding: '8px 16px', fontSize: 16, color: '#ccccee',
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div style={{
          position: 'absolute', bottom: 28, right: 50,
          fontSize: 16, color: '#4a4a6a',
        }}>
          #ExitPlanner
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
