// JHULSACAST, the late-blight forecast CPRI tuned for the plains of West Bengal (Sharma, "Forecasting
// late blight of potato in plains of West Bengal using JHULSACAST model", Potato Journal 42(1),
// https://epubs.icar.org.in/index.php/PotatoJ/article/view/47731). From the abstract, late blight
// first appears within 14 days when either holds:
//   - 7-day: the 7-day moving sum of hours at RH ≥ 90% is ≥ 105 and of hours at 7.2–26.6°C is ≥ 150,
//     for 7 consecutive days;
//   - 5-day: the 5-day moving sums are ≥ 65 and ≥ 105 hours, for 5 consecutive days, and the rain on
//     two consecutive days sums to ≥ 2.5 mm.
// The abstract doesn't say where the rain must fall; here the two days lie within the 5 days the
// condition holds. Only the backtest uses this rule (scripts/compare-blight-rules.ts); the app doesn't.
import type { Risk } from '@/lib/data'
import { addDays } from '@/lib/dates'
import { HUMID_RH } from '@/lib/risk'
import type { HourlyForecast } from '@/lib/weather'

export const MILD_MIN_C = 7.2
export const MILD_MAX_C = 26.6
// Days from the forecast firing to the disease first appearing, at most.
export const LEAD_DAYS = 14

export const SEVEN_DAY = { days: 7, humidHours: 105, mildHours: 150 }
export const FIVE_DAY = { days: 5, humidHours: 65, mildHours: 105, rainMm: 2.5 }

// One day's hours at RH ≥ 90% and at 7.2–26.6°C, and its rain (null when the source has none).
export type JhulsaDay = { date: string; humidHours: number; mildHours: number; rainMm: number | null }
export type JhulsaRisk = JhulsaDay & { sevenDay: boolean; fiveDay: boolean; risk: Risk }

// Group hourly readings by local date. Missing readings count as neither humid nor mild; a day
// with no temperature at all is dropped, as in summarizeDays.
export function summarizeJhulsaDays(hourly: HourlyForecast): JhulsaDay[] {
  const byDate = new Map<string, { humidHours: number; mildHours: number; rainMm: number | null; hasTemp: boolean }>()
  hourly.time.forEach((t, i) => {
    const date = t.slice(0, 10)
    const day = byDate.get(date) ?? { humidHours: 0, mildHours: 0, rainMm: null, hasTemp: false }
    const temp = hourly.temperature[i]
    const rh = hourly.humidity[i]
    const rain = hourly.precipitation?.[i]
    if (temp != null) {
      day.hasTemp = true
      if (temp >= MILD_MIN_C && temp <= MILD_MAX_C) day.mildHours++
    }
    if (rh != null && rh >= HUMID_RH) day.humidHours++
    if (rain != null) day.rainMm = (day.rainMm ?? 0) + rain
    byDate.set(date, day)
  })
  return [...byDate].filter(([, d]) => d.hasTemp).map(([date, { humidHours, mildHours, rainMm }]) => ({ date, humidHours, mildHours, rainMm }))
}

// The `n` days ending on `date`, or null if any is missing from the data: a moving sum over a gap
// would undercount, so it doesn't count.
function window(byDate: Map<string, JhulsaDay>, date: string, n: number): JhulsaDay[] | null {
  const days = Array.from({ length: n }, (_, i) => byDate.get(addDays(date, i - n + 1)))
  return days.every((d) => d !== undefined) ? (days as JhulsaDay[]) : null
}

const sum = (days: JhulsaDay[], key: 'humidHours' | 'mildHours') => days.reduce((s, d) => s + d[key], 0)

// A danger day is a day either condition is met on: its moving sums have held for the run of days
// ending that day. Days before enough data (13 days for the 7-day condition) can't fire.
export function classifyJhulsaDays(days: JhulsaDay[]): JhulsaRisk[] {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const holds = (date: string, rule: { days: number; humidHours: number; mildHours: number }) => {
    const w = window(byDate, date, rule.days)
    return w !== null && sum(w, 'humidHours') >= rule.humidHours && sum(w, 'mildHours') >= rule.mildHours
  }
  const prevails = (date: string, rule: { days: number; humidHours: number; mildHours: number }) =>
    Array.from({ length: rule.days }, (_, i) => addDays(date, -i)).every((d) => holds(d, rule))
  const wetPair = (date: string) => {
    const w = window(byDate, date, FIVE_DAY.days)
    return w !== null && w.slice(1).some((d, i) => w[i].rainMm !== null && d.rainMm !== null && w[i].rainMm! + d.rainMm >= FIVE_DAY.rainMm)
  }
  return days.map((day) => {
    const sevenDay = prevails(day.date, SEVEN_DAY)
    const fiveDay = prevails(day.date, FIVE_DAY) && wetPair(day.date)
    return { ...day, sevenDay, fiveDay, risk: sevenDay || fiveDay ? 'danger' : 'safe' }
  })
}
