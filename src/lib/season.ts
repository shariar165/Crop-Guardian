// When disease risk matters at all: while the crop is in the field. Windows per season are in crops.ts.
import { bnDate } from '@/lib/bn'
import { CROPS, type MonthDay, SEASONS, type SeasonId } from '@/lib/crops'
import { addDays } from '@/lib/dates'

// Potato's days after planting until the crop emerges, and until it is harvested.
export const EMERGENCE_DAYS = SEASONS.potato.startDays
export const HARVEST_DAYS = SEASONS.potato.endDays

// Without a planting date, assume the usual potato season in northern Bangladesh (inclusive).
export const FALLBACK_SEASON_START = SEASONS.potato.fallback.start
export const FALLBACK_SEASON_END = SEASONS.potato.fallback.end

export type Season = {
  // Where today falls relative to the window.
  phase: 'before' | 'during' | 'after'
  start: string
  end: string
  source: 'planting' | 'fallback'
}

const monthDay = ({ month, day }: MonthDay) => `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

function phaseOf(today: string, start: string, end: string): Season['phase'] {
  return today < start ? 'before' : today > end ? 'after' : 'during'
}

// The crop window from the planting (or transplanting) date, or else the fallback season that
// today falls in (or the next one, between seasons).
export function seasonFor(today: string, planting: string | null, id: SeasonId = 'potato'): Season {
  const spec = SEASONS[id]
  if (planting) {
    const start = addDays(planting, spec.startDays)
    const end = addDays(planting, spec.endDays)
    return { phase: phaseOf(today, start, end), start, end, source: 'planting' }
  }
  const year = Number(today.slice(0, 4))
  const [from, to] = [monthDay(spec.fallback.start), monthDay(spec.fallback.end)]
  // A window across the new year (potato, Nov–Mar) started last year if today is before its end.
  const startYear = from > to ? (today.slice(5) <= to ? year - 1 : year) : today.slice(5) <= to ? year : year + 1
  const start = `${startYear}-${from}`
  const end = `${from > to ? startYear + 1 : startYear}-${to}`
  return { phase: phaseOf(today, start, end), start, end, source: 'fallback' }
}

export function riskActive(season: Season): boolean {
  return season.phase === 'during'
}

// The line under the off-season title: when alerts will start. Fits two lines in the Home header.
export function offSeasonMessage(season: Season, id: SeasonId = 'potato'): string {
  const crop = CROPS[SEASONS[id].crop]
  if (season.phase === 'after') return crop.afterHarvest
  const from = `${bnDate(season.start)} থেকে ঝুঁকির খবর দেব`
  return season.source === 'planting' ? `${crop.startPhrase}, ${from}` : from
}
