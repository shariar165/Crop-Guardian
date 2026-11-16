// How a weather model's humid hours compare with a station's, for the backtest
// (scripts/compare-blight-rules.ts). Pure: series in, numbers out.
import { addDays } from '@/lib/dates'
import type { HourlyForecast } from '@/lib/weather'

// Hours at RH ≥ `threshold` on each local date. Only days with all 24 hours read count.
export function humidHoursByDay(hourly: HourlyForecast, threshold: number): Map<string, number> {
  const hours = new Map<string, { humid: number; read: number }>()
  hourly.time.forEach((t, i) => {
    const day = hours.get(t.slice(0, 10)) ?? { humid: 0, read: 0 }
    const rh = hourly.humidity[i]
    if (rh != null) {
      day.read++
      if (rh >= threshold) day.humid++
    }
    hours.set(t.slice(0, 10), day)
  })
  return new Map([...hours].filter(([, d]) => d.read === 24).map(([date, d]) => [date, d.humid]))
}

// The model read only at the station's reading times (00, 03, … 21 local), each standing for 3
// hours: what the station's sampling alone would do to the model's count.
export function sampledEvery3h(hourly: HourlyForecast): HourlyForecast {
  const at = new Map(hourly.time.map((t, i) => [t, hourly.humidity[i]]))
  const humidity = hourly.time.map((t) => at.get(`${t.slice(0, 11)}${String(Math.floor(Number(t.slice(11, 13)) / 3) * 3).padStart(2, '0')}:00`) ?? null)
  return { ...hourly, humidity }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)

// Mean humid hours a day in each month ("2024-01"), over `dates` only, with how many days.
export function monthlyMeans(byDay: Map<string, number>, dates: string[]): { month: string; days: number; mean: number }[] {
  const months = new Map<string, number[]>()
  for (const d of dates) {
    const h = byDay.get(d)
    if (h === undefined) continue
    months.set(d.slice(0, 7), [...(months.get(d.slice(0, 7)) ?? []), h])
  }
  return [...months].map(([month, hs]) => ({ month, days: hs.length, mean: mean(hs) }))
}

// The 7 consecutive days with the most humid hours, among windows whose every day is in `dates`.
export function worstWeek(byDay: Map<string, number>, dates: string[]): { start: string; hours: number } | null {
  const allowed = new Set(dates)
  let best: { start: string; hours: number } | null = null
  for (const start of dates) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    if (!week.every((d) => allowed.has(d) && byDay.has(d))) continue
    const hours = week.reduce((s, d) => s + byDay.get(d)!, 0)
    if (!best || hours > best.hours) best = { start, hours }
  }
  return best
}

export type ThresholdFit = { threshold: number; days: number; stationMean: number; modelMeanAt90: number; modelMean: number; maeAt90: number; mae: number }
// One station's days: the model at the station, the station's hours at RH ≥ 90% a day, and the dates to use.
export type FitPair = { model: HourlyForecast; station: Map<string, number>; dates: string[] }

// The RH threshold on the model whose mean humid hours a day come closest to the station's hours at
// RH ≥ 90%, pooled over every pair's days. Ties go to the threshold nearer 90.
export function fitThreshold(pairs: FitPair[], { from = 70, to = 100, step = 0.5, stationThreshold = 90 } = {}): ThresholdFit {
  const score = (t: number) => {
    const both = pairs.flatMap(({ model, station, dates }) => {
      const byDay = humidHoursByDay(model, t)
      return dates.filter((d) => station.has(d) && byDay.has(d)).map((d) => [byDay.get(d)!, station.get(d)!])
    })
    return { n: both.length, mean: mean(both.map(([m]) => m)), stationMean: mean(both.map(([, s]) => s)), mae: mean(both.map(([m, s]) => Math.abs(m - s))) }
  }
  let best = { t: stationThreshold, gap: Infinity }
  for (let i = 0; from + i * step <= to + 1e-9; i++) {
    const t = from + i * step
    const s = score(t)
    const gap = Math.abs(s.mean - s.stationMean)
    if (gap < best.gap - 1e-9 || (Math.abs(gap - best.gap) < 1e-9 && Math.abs(t - stationThreshold) < Math.abs(best.t - stationThreshold))) best = { t, gap }
  }
  const at90 = score(stationThreshold)
  const fit = score(best.t)
  return { threshold: best.t, days: fit.n, stationMean: fit.stationMean, modelMeanAt90: at90.mean, modelMean: fit.mean, maeAt90: at90.mae, mae: fit.mae }
}
