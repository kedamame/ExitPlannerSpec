import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 200,
          height: 200,
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          border: '2px solid #7c3aed',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            EP
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#a78bfa',
              letterSpacing: '2px',
              marginTop: 4,
            }}
          >
            EXIT
          </div>
        </div>
      </div>
    ),
    { width: 200, height: 200 },
  )
}
