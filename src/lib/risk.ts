// Late-blight risk from weather alone, using the Hutton criteria (UK, 2017):
// two consecutive days with min temperature >= 10°C and >= 6 hours at RH >= 90%.
import { bnWeekday, toBnDigits } from '@/lib/bn'
import type { Risk } from '@/lib/data'
import { addDays } from '@/lib/dates'
import type { HourlyForecast } from '@/lib/weather'

export const MIN_TEMP_C = 10
export const HUMID_RH = 90
export const HUTTON_HUMID_HOURS = 6
// A stricter alternative, compared in docs/risk-backtest.md. Not used by the app.
export const STRICT_HUMID_HOURS = 10
export const NEAR_HUMID_HOURS = 4
export const LOOKAHEAD_DAYS = 2

export type DaySummary = { date: string; minTemp: number; humidHours: number }
export type DayRisk = DaySummary & { risk: Risk }
// What the 5-day strip and the decision text need; the sample strips have only this.
export type StripDay = Pick<DayRisk, 'date' | 'risk'>
// Each crop's rule fills `days` with its own day summaries; screens only read date and risk.
export type RiskAssessment = { today: Risk; days: StripDay[]; reason: string }

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

export function qualifies(day: DaySummary, humidHours = HUTTON_HUMID_HOURS): boolean {
  return day.minTemp >= MIN_TEMP_C && day.humidHours >= humidHours
}

// The shape every disease rule here shares: a qualifying day next to another is danger, a lone
// qualifying day or a near miss is watch. Days outside the data, or missing from it, count as
// not qualifying. Used by this late-blight rule and the rice-blast rule (blast.ts).
export function classifyRun<T extends { date: string }>(
  days: T[],
  qualifiesDay: (day: T) => boolean,
  nearDay: (day: T) => boolean,
): (T & { risk: Risk })[] {
  const qualifyingDates = new Set(days.filter(qualifiesDay).map((d) => d.date))
  return days.map((day) => {
    let risk: Risk = 'safe'
    if (qualifiesDay(day)) {
      const neighbourQualifies = [-1, 1].some((n) => qualifyingDates.has(addDays(day.date, n)))
      risk = neighbourQualifies ? 'danger' : 'watch'
    } else if (nearDay(day)) {
      risk = 'watch'
    }
    return { ...day, risk }
  })
}

// `humidHours` is only changed by the backtest script, to compare a stricter rule.
export function classifyDays(days: DaySummary[], { humidHours = HUTTON_HUMID_HOURS } = {}): DayRisk[] {
  return classifyRun(
    days,
    (d) => qualifies(d, humidHours),
    (d) => d.minTemp >= MIN_TEMP_C && d.humidHours >= NEAR_HUMID_HOURS,
  )
}

// Index of the first danger day within `within` days after today, or -1.
export function upcomingDanger(days: StripDay[], within = LOOKAHEAD_DAYS): number {
  for (let i = 1; i <= within && i < days.length; i++) {
    if (days[i].risk === 'danger') return i
  }
  return -1
}

// Today's level, raised to "watch" when a danger day is coming soon. Never lowered.
export function overallRisk(days: StripDay[]): Risk {
  const today = days[0].risk
  return today === 'safe' && upcomingDanger(days) !== -1 ? 'watch' : today
}

// The consecutive run of qualifying days starting at `from`.
function huttonRun(days: DayRisk[], from: number): DayRisk[] {
  const run: DayRisk[] = []
  for (let i = from; i < days.length && qualifies(days[i]); i++) run.push(days[i])
  return run
}

export const HUMID = `আর্দ্রতা ${toBnDigits(HUMID_RH)}%-এর বেশি`

// "কাল", or the weekday of a danger day further ahead: named from the forecast, never fixed.
export function dangerFrom(days: StripDay[], index: number): string {
  return index === 1 ? 'কাল' : bnWeekday(days[index].date) + 'বার'
}

export function bnTemp(t: number): string {
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
  if (soon !== -1) return `${dangerFrom(days, soon)} থেকে ${runPhrase(huttonRun(days, soon))}`

  if (today === 'watch') return `আজ ${toBnDigits(day.humidHours)} ঘণ্টা ${HUMID}, রাতে ${bnTemp(day.minTemp)}`
  if (day.minTemp < MIN_TEMP_C) return `রাতে তাপমাত্রা ${bnTemp(day.minTemp)} — রোগ ছড়ানোর মতো গরম নয়`
  if (day.humidHours === 0) return `আজ আর্দ্রতা ${toBnDigits(HUMID_RH)}% ছোঁবে না, ঝুঁকি কম`
  return `আজ মাত্র ${toBnDigits(day.humidHours)} ঘণ্টা ${HUMID}, ঝুঁকি কম`
}

export const DECISION: Record<Risk, string> = {
  safe: 'আগামী কয়েক দিন ঝুঁকি কম। শুধু শুধু ওষুধ দিয়ে টাকা নষ্ট করবেন না।',
  watch: 'আবহাওয়া মাঝে মাঝে ভেজা। রোজ সকালে পাতা দেখে নিন।',
  danger: 'নাবি ধসা ছড়ানোর মতো আবহাওয়া চলছে। আজই পাতা পরীক্ষা করুন।',
}

// The body under today's decision title. When a danger day lies ahead it is named from the
// forecast (never a fixed weekday), with the afternoon before it: when the farmer has SMS alerts
// on (`alerts`), we promise to text then (src/lib/alerts.ts); otherwise we ask them to look again.
// Like the reason, it must fit two lines on the Home decision card.
// `decision` holds the crop's line for each level (see crops.ts); late blight's by default.
export function buildDecision(days: StripDay[], today: Risk, decision: Record<Risk, string> = DECISION, alerts = false): string {
  const next = today === 'danger' ? -1 : upcomingDanger(days, days.length)
  if (next === -1) return decision[today]
  const from = dangerFrom(days, next)
  const dayBefore = next === 1 ? 'আজ' : next === 2 ? 'কাল' : 'আগের দিন'
  return `${from} থেকে ঝুঁকি বাড়বে। ${dayBefore} বিকেলে ${alerts ? 'SMS-এ জানাব' : 'আবার দেখে নিন'}।`
}

// `today` (YYYY-MM-DD) drops days that are already over, e.g. a cached forecast just after midnight.
// They are dropped after classifying, so a qualifying yesterday still counts toward a Hutton period.
export function assessRisk(hourly: HourlyForecast, today?: string): RiskAssessment {
  const days = classifyDays(summarizeDays(hourly)).filter((d) => !today || d.date >= today)
  if (days.length === 0) throw new Error('Forecast has no days from today onward')
  const risk = overallRisk(days)
  return { today: risk, days, reason: buildReason(days, risk) }
}
