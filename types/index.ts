export type LineType = 'takeProfit' | 'stopLoss'

export interface PriceLine {
  id: string
  type: LineType
  price: number
}

export interface Position {
  id: string
  coinId: string
  coinSymbol: string
  coinName: string
  chain: string
  lines: PriceLine[]
  createdAt: string
  updatedAt: string
}

export interface CoinSearchResult {
  id: string
  name: string
  symbol: string
  thumb: string
  platform?: string  // CoinGecko platform id, e.g. 'ethereum', 'base'
}

export interface OHLCData {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M'

export interface TimeframeConfig {
  label: Timeframe
  days: string
  interval: string
}
