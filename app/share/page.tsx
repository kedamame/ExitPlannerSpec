import type { Metadata } from 'next'

interface Props {
  searchParams: Promise<{
    coinId?: string
    coinName?: string
    coinSymbol?: string
    price?: string
    tp?: string
    sl?: string
  }>
}

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://exit-planner-spec.vercel.app'

const COIN_ID_RE = /^[a-z0-9-]{1,64}$/
const SAFE_RE = /^[\w\s\-.()#$%&@!?:,]{1,64}$/
const NUM_RE = /^[\d.,]{1,80}$/

function safe(v: string | undefined, re: RegExp, fallback: string) {
  return v && re.test(v) ? v : fallback
}

function prettifyId(id: string) {
  return id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const coinId = safe(sp.coinId, COIN_ID_RE, '')

  // Derive fallbacks from coinId so we never show "???" or the raw slug
  const symbolFallback = coinId ? coinId.split('-')[0].toUpperCase().slice(0, 8) : '???'
  const nameFallback   = coinId ? prettifyId(coinId) : 'Token'

  // Reject placeholder "???" that may have been passed from an earlier bug
  const rawSymbol = sp.coinSymbol
  const coinSymbol = (rawSymbol && rawSymbol !== '???' && SAFE_RE.test(rawSymbol))
    ? rawSymbol : symbolFallback
  const rawName = sp.coinName
  const coinName = (rawName && rawName !== coinId && SAFE_RE.test(rawName))
    ? rawName : nameFallback
  const price      = safe(sp.price,      NUM_RE,     '0')
  const tp         = safe(sp.tp,         NUM_RE,     '')
  const sl         = safe(sp.sl,         NUM_RE,     '')

  const ogUrl = `${BASE_URL}/api/og?coinId=${encodeURIComponent(coinId)}&coinName=${encodeURIComponent(coinName)}&coinSymbol=${encodeURIComponent(coinSymbol)}&price=${price}&tp=${encodeURIComponent(tp)}&sl=${encodeURIComponent(sl)}`
  const appUrl = `${BASE_URL}/chart/${coinId}`

  const tpLabel = tp ? `TP: $${tp.split(',')[0]}` : ''
  const slLabel = sl ? `SL: $${sl.split(',')[0]}` : ''
  const desc = [tpLabel, slLabel].filter(Boolean).join(' | ') || 'Exit strategy'

  return {
    title: `${coinSymbol} ${desc} — Exit Planner`,
    description: desc,
    openGraph: {
      title: `${coinSymbol} Exit Strategy`,
      description: desc,
      images: [{ url: ogUrl, width: 1200, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogUrl],
    },
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: ogUrl,
        button: {
          title: 'Open Exit Planner',
          action: {
            type: 'launch_frame',
            name: 'Exit Planner',
            url: appUrl,
            splashBackgroundColor: '#080818',
          },
        },
      }),
    },
  }
}

export default async function SharePage({ searchParams }: Props) {
  const sp = await searchParams
  const coinId = safe(sp.coinId, COIN_ID_RE, '')

  return (
    <html lang="en">
      <head>
        {/* Client-side redirect to the chart */}
        <meta httpEquiv="refresh" content={`0;url=/chart/${coinId}`} />
      </head>
      <body style={{ background: '#080818', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
        <a href={`/chart/${coinId}`} style={{ color: '#a78bfa' }}>
          Opening Exit Planner…
        </a>
      </body>
    </html>
  )
}
