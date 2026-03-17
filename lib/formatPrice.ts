/**
 * Format a USD price for display, handling everything from BTC ($60,000)
 * to micro-cap meme coins ($0.000000001234).
 */
export function formatPrice(n: number): string {
  if (!n || n <= 0) return '$0'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + Math.round(n).toLocaleString()

  if (n >= 1) {
    // Show up to 6 decimal places, strip trailing zeros
    return '$' + n.toFixed(6).replace(/\.?0+$/, '')
  }

  // Sub-$1: show 4 significant figures without scientific notation
  // e.g. 0.00001234 → mag=-5, dp=8 → "$0.00001234"
  const mag = Math.floor(Math.log10(n))
  const dp = Math.min(20, -mag + 3)
  return '$' + n.toFixed(dp).replace(/\.?0+$/, '')
}
