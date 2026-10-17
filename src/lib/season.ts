// When late-blight risk matters at all: while the crop is in the field.
import { bnDate } from '@/lib/bn'
import { addDays } from '@/lib/dates'

// Days after planting until the crop emerges, and until it is harvested.
export const EMERGENCE_DAYS = 15
export const HARVEST_DAYS = 100

// Without a planting date, assume the usual potato season in northern Bangladesh (inclusive).
export const FALLBACK_SEASON_START = { month: 11, day: 15 }
export const FALLBACK_SEASON_END = { month: 3, day: 15 }

export type Season = {
  // Where today falls relative to the window.
  phase: 'before' | 'during' | 'after'
  start: string
  end: string
  source: 'planting' | 'fallback'
}

const monthDay = ({ month, day }: { month: number; day: number }) =>
  `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

function phaseOf(today: string, start: string, end: string): Season['phase'] {
  return today < start ? 'before' : today > end ? 'after' : 'during'
}

// The crop window from the planting date, or else the fallback season that today falls in
// (or the next one, between seasons).
export function seasonFor(today: string, planting: string | null): Season {
  if (planting) {
    const start = addDays(planting, EMERGENCE_DAYS)
    const end = addDays(planting, HARVEST_DAYS)
    return { phase: phaseOf(today, start, end), start, end, source: 'planting' }
  }
  const year = Number(today.slice(0, 4))
  const startYear = today.slice(5) <= monthDay(FALLBACK_SEASON_END) ? year - 1 : year
  const start = `${startYear}-${monthDay(FALLBACK_SEASON_START)}`
  const end = `${startYear + 1}-${monthDay(FALLBACK_SEASON_END)}`
  return { phase: phaseOf(today, start, end), start, end, source: 'fallback' }
}

// Replay and the ?risk= demos always show risk, whatever the season.
export function riskActive(season: Season, bypass: boolean): boolean {
  return bypass || season.phase === 'during'
}

// The line under "এখন ধসা রোগের মৌসুম নয়": when alerts will start. Fits two lines in the Home header.
export function offSeasonMessage(season: Season): string {
  if (season.phase === 'after') return 'ফসল তোলার সময় পেরিয়ে গেছে। নতুন আলু লাগালে তারিখ দিন।'
  const from = `${bnDate(season.start)} থেকে ঝুঁকির খবর দেব`
  return season.source === 'planting' ? `চারা গজালে, ${from}` : from
}
