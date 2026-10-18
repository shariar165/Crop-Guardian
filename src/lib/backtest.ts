// How often the risk engine would alert over a run of past days. Used by the backtest script.
import { daysBetween } from '@/lib/dates'
import type { StripDay } from '@/lib/risk'

// A danger day starts a new alert after at least this many non-danger days.
export const ALERT_QUIET_DAYS = 2

export type AlertStats = {
  dangerDays: number
  alerts: string[] // the date each alert starts
  avgGapDays: number | null // mean days from one alert's start to the next; null with fewer than 2
}

// `days` in date order. Dates missing from the data count as non-danger.
export function alertStats(days: StripDay[]): AlertStats {
  const danger = days.filter((d) => d.risk === 'danger').map((d) => d.date)
  const alerts = danger.filter((date, i) => i === 0 || daysBetween(danger[i - 1], date) - 1 >= ALERT_QUIET_DAYS)
  const gaps = alerts.slice(1).map((date, i) => daysBetween(alerts[i], date))
  return {
    dangerDays: danger.length,
    alerts,
    avgGapDays: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
  }
}
