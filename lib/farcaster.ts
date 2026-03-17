import type { Position } from '@/types'
import { formatPrice } from './formatPrice'

export function buildCastText(position: Position, locale: string = 'en'): string {
  const tpLines = position.lines.filter((l) => l.type === 'takeProfit')
  const slLines = position.lines.filter((l) => l.type === 'stopLoss')

  const tpText = tpLines.map((l) => formatPrice(l.price)).join(', ') || '-'
  const slText = slLines.map((l) => formatPrice(l.price)).join(', ') || '-'

  if (locale === 'ja') {
    return `${position.coinName} の出口戦略を設定しました 📊\nTP: ${tpText} / SL: ${slText}\n#ExitPlanner`
  }
  return `${position.coinName} exit strategy set 📊\nTP: ${tpText} / SL: ${slText}\n#ExitPlanner`
}
