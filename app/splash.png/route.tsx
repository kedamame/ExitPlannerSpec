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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-2px',
          }}
        >
          EP
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#a78bfa',
            letterSpacing: '1px',
            textAlign: 'center',
          }}
        >
          Exit Planner
        </div>
        <div
          style={{
            width: 60,
            height: 2,
            background: '#7c3aed',
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { width: 200, height: 200 },
  )
}
