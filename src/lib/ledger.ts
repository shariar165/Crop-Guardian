// The season ledger: what the farmer saved by spraying only when the weather called for it.
//
// The comparison is the usual calendar habit of one preventive spray a week. Each week from
// emergence (planting + 15 days) is judged from the real weather and the sprays the farmer logged:
// no danger day and no spray is one calendar spray saved; a danger day with a spray is a spray in
// time. Nothing is counted for a week that isn't over yet, or that has no weather data.
//
// That baseline is a potato habit. For a crop without one (paddy: farmers spray for blast around
// booting and heading, not weekly), a quiet week is just quiet and nothing is counted as saved.
import { CROPS, SEASONS, type SeasonId } from '@/lib/crops'
import type { Risk } from '@/lib/data'
import { addDays, daysBetween } from '@/lib/dates'
import type { StripDay } from '@/lib/risk'

export const WEEK_DAYS = 7

export type WeekKind =
  | 'saved' // no danger, no spray: one calendar spray saved
  | 'calm' // no danger, no spray, for a crop with no calendar habit to compare with
  | 'onTime' // danger, sprayed
  | 'missed' // danger, not sprayed
  | 'extra' // sprayed without danger
  | 'ongoing' // this week, nothing to count yet
  | 'noData' // no weather for the week

export type LedgerWeek = {
  start: string
  end: string
  // Days since planting, for the timeline label.
  dayFrom: number
  dayTo: number
  worst: Risk | null
  dangerDays: number
  sprays: string[]
  kind: WeekKind
  amount: number
}

export type Ledger = {
  // Newest first.
  weeks: LedgerWeek[]
  savedTotal: number
  savedCount: number
  onTimeCount: number
  missedCount: number
  sprayCount: number
}

const RANK: Record<Risk, number> = { safe: 0, watch: 1, danger: 2 }

// The days the ledger covers: emergence (or establishment) to harvest, cut at today. Null before it starts.
export function ledgerSpan(planting: string, today: string, season: SeasonId = 'potato'): { from: string; to: string } | null {
  const from = addDays(planting, SEASONS[season].startDays)
  const harvest = addDays(planting, SEASONS[season].endDays)
  const to = today < harvest ? today : harvest
  return from <= to ? { from, to } : null
}

export function buildLedger({
  planting,
  today,
  days,
  sprays,
  cost,
  season = 'potato',
}: {
  planting: string
  today: string
  days: StripDay[]
  sprays: string[]
  cost: number
  season?: SeasonId
}): Ledger {
  const span = ledgerSpan(planting, today, season)
  const quietKind: WeekKind = CROPS[SEASONS[season].crop].calendarBaseline ? 'saved' : 'calm'
  const weeks: LedgerWeek[] = []
  if (span) {
    const riskOn = new Map(days.map((d) => [d.date, d.risk]))
    for (let start = span.from; start <= span.to; start = addDays(start, WEEK_DAYS)) {
      const fullEnd = addDays(start, WEEK_DAYS - 1)
      const end = fullEnd < span.to ? fullEnd : span.to
      const length = daysBetween(start, end) + 1
      const risks = Array.from({ length }, (_, i) => riskOn.get(addDays(start, i))).filter((r): r is Risk => r !== undefined)
      const worst = risks.length ? risks.reduce((a, b) => (RANK[b] > RANK[a] ? b : a)) : null
      const dangerDays = risks.filter((r) => r === 'danger').length
      const inWeek = sprays.filter((s) => s >= start && s <= end).sort()
      // A week is over once its seventh day has passed, or once the crop is harvested.
      const over = fullEnd < today || (end < fullEnd && span.to < today)
      const sprayed = inWeek.length > 0

      let kind: WeekKind
      if (dangerDays > 0) kind = sprayed ? 'onTime' : over ? 'missed' : 'ongoing'
      else if (sprayed) kind = 'extra'
      else if (!over) kind = 'ongoing'
      // Only a week whose every day is known can be called safe.
      else kind = risks.length === length ? quietKind : 'noData'

      weeks.push({
        start,
        end,
        dayFrom: daysBetween(planting, start),
        dayTo: daysBetween(planting, end),
        worst,
        dangerDays,
        sprays: inWeek,
        kind,
        amount: kind === 'saved' ? cost : 0,
      })
    }
  }
  weeks.reverse()
  const count = (k: WeekKind) => weeks.filter((w) => w.kind === k).length
  return {
    weeks,
    savedTotal: weeks.reduce((sum, w) => sum + w.amount, 0),
    savedCount: count('saved'),
    onTimeCount: count('onTime'),
    missedCount: count('missed'),
    sprayCount: weeks.reduce((n, w) => n + w.sprays.length, 0),
  }
}
