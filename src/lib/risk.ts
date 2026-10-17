// Late-blight risk from weather alone, using the Hutton criteria (UK, 2017):
// two consecutive days with min temperature >= 10°C and >= 6 hours at RH >= 90%.
import { bnWeekday, toBnDigits } from '@/lib/bn'
import type { Risk } from '@/lib/data'
import type { HourlyForecast } from '@/lib/weather'

export const MIN_TEMP_C = 10
export const HUMID_RH = 90
export const HUTTON_HUMID_HOURS = 6
export const NEAR_HUMID_HOURS = 4
export const LOOKAHEAD_DAYS = 2

export type DaySummary = { date: string; minTemp: number; humidHours: number }
export type DayRisk = DaySummary & { risk: Risk }
export type RiskAssessment = { today: Risk; days: DayRisk[]; reason: string }

// Group hourly readings by local date (the forecast's `time` is already local).
// Missing (null) readings are ignored; a day with no temperature at all is dropped.
export function summarizeDays(hourly: HourlyForecast): DaySummary[] {
  const byDate = new Map<string, { minTemp: number; humidHours: number }>()
  hourly.time.forEach((t, i) => {
    const date = t.slice(0, 10)
    const day = byDate.get(date) ?? { minTemp: Infinity, humidHours: 0 }
    const temp = hourly.temperature[i]
    const rh = hourly.humidity[i]
    if (temp != null) day.minTemp = Math.min(day.minTemp, temp)
    if (rh != null && rh >= HUMID_RH) day.humidHours++
    byDate.set(date, day)
  })
  return [...byDate]
    .filter(([, d]) => Number.isFinite(d.minTemp))
    .map(([date, d]) => ({ date, ...d }))
}

export function qualifies(day: DaySummary): boolean {
  return day.minTemp >= MIN_TEMP_C && day.humidHours >= HUTTON_HUMID_HOURS
}

// Days outside the forecast window count as not qualifying.
export function classifyDays(days: DaySummary[]): DayRisk[] {
  return days.map((day, i) => {
    let risk: Risk = 'safe'
    if (qualifies(day)) {
      const prev = days[i - 1]
      const next = days[i + 1]
      risk = (prev && qualifies(prev)) || (next && qualifies(next)) ? 'danger' : 'watch'
    } else if (day.minTemp >= MIN_TEMP_C && day.humidHours >= NEAR_HUMID_HOURS) {
      risk = 'watch'
    }
    return { ...day, risk }
  })
}

// Index of the first danger day within the look-ahead window after today, or -1.
function upcomingDanger(days: DayRisk[]): number {
  for (let i = 1; i <= LOOKAHEAD_DAYS && i < days.length; i++) {
    if (days[i].risk === 'danger') return i
  }
  return -1
}

// Today's level, raised to "watch" when a danger day is coming soon. Never lowered.
export function overallRisk(days: DayRisk[]): Risk {
  const today = days[0].risk
  return today === 'safe' && upcomingDanger(days) !== -1 ? 'watch' : today
}

// The consecutive run of qualifying days starting at `from`.
function huttonRun(days: DayRisk[], from: number): DayRisk[] {
  const run: DayRisk[] = []
  for (let i = from; i < days.length && qualifies(days[i]); i++) run.push(days[i])
  return run
}

const HUMID = `আর্দ্রতা ${toBnDigits(HUMID_RH)}%-এর বেশি`

function bnTemp(t: number): string {
  return `${toBnDigits(Math.round(t))}°সে`
}

function runPhrase(run: DayRisk[]): string {
  const hours = Math.min(...run.map((d) => d.humidHours))
  return `${toBnDigits(run.length)} দিন রোজ ${toBnDigits(hours)} ঘণ্টা ${HUMID}`
}

// Keep every sentence to two lines in the Home header (~50 characters).
export function buildReason(days: DayRisk[], today: Risk): string {
  const day = days[0]
  if (today === 'danger') return `আগামী ${runPhrase(huttonRun(days, 0))}`

  const soon = upcomingDanger(days)
  if (soon !== -1) {
    const when = soon === 1 ? 'কাল' : bnWeekday(days[soon].date) + 'বার'
    return `${when} থেকে ${runPhrase(huttonRun(days, soon))}`
  }

  if (today === 'watch') return `আজ ${toBnDigits(day.humidHours)} ঘণ্টা ${HUMID}, রাতে ${bnTemp(day.minTemp)}`
  if (day.minTemp < MIN_TEMP_C) return `রাতে তাপমাত্রা ${bnTemp(day.minTemp)} — রোগ ছড়ানোর মতো গরম নয়`
  if (day.humidHours === 0) return `আজ আর্দ্রতা ${toBnDigits(HUMID_RH)}% ছোঁবে না, ঝুঁকি কম`
  return `আজ মাত্র ${toBnDigits(day.humidHours)} ঘণ্টা ${HUMID}, ঝুঁকি কম`
}

// `today` (YYYY-MM-DD) drops days that are already over, e.g. a cached forecast just after midnight.
// They are dropped after classifying, so a qualifying yesterday still counts toward a Hutton period.
export function assessRisk(hourly: HourlyForecast, today?: string): RiskAssessment {
  const days = classifyDays(summarizeDays(hourly)).filter((d) => !today || d.date >= today)
  if (days.length === 0) throw new Error('Forecast has no days from today onward')
  const risk = overallRisk(days)
  return { today: risk, days, reason: buildReason(days, risk) }
}
