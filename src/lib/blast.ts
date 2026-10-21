// Rice-blast risk from weather alone. A draft BLASTAM-style rule (long wet spells at moderate
// temperatures), to be confirmed with BRRI and the backtest (docs/blast-backtest.md) before field use.
// Open-Meteo has no leaf wetness, so an hour at RH >= 90% stands in for a wet leaf.
//   wet hour: RH >= 90% and 18–28°C; a day qualifies with >= 10 wet hours;
//   two qualifying days in a row are danger, as with late blight (risk.ts).
import { toBnDigits } from '@/lib/bn'
import type { Risk } from '@/lib/data'
import { bnTemp, classifyRun, dangerFrom, HUMID, HUMID_RH, overallRisk, upcomingDanger } from '@/lib/risk'
import type { RiskAssessment } from '@/lib/risk'
import type { HourlyForecast } from '@/lib/weather'

export const WET_MIN_C = 18
export const WET_MAX_C = 28
export const BLAST_WET_HOURS = 10
export const NEAR_WET_HOURS = 7

export type BlastDaySummary = {
  date: string
  // Hours at RH >= 90% at any temperature, and their mean temperature (null with none).
  humidHours: number
  humidTemp: number | null
  // Hours at RH >= 90% within the temperature band blast needs.
  wetHours: number
}
export type BlastDayRisk = BlastDaySummary & { risk: Risk }

// Group hourly readings by local date, as summarizeDays does for late blight. An hour with either
// reading missing is ignored; a day with no complete hour at all is dropped.
export function summarizeBlastDays(hourly: HourlyForecast): BlastDaySummary[] {
  const byDate = new Map<string, { hours: number; humidHours: number; humidSum: number; wetHours: number }>()
  hourly.time.forEach((t, i) => {
    const date = t.slice(0, 10)
    const day = byDate.get(date) ?? { hours: 0, humidHours: 0, humidSum: 0, wetHours: 0 }
    byDate.set(date, day)
    const temp = hourly.temperature[i]
    const rh = hourly.humidity[i]
    if (temp == null || rh == null) return
    day.hours++
    if (rh < HUMID_RH) return
    day.humidHours++
    day.humidSum += temp
    if (temp >= WET_MIN_C && temp <= WET_MAX_C) day.wetHours++
  })
  return [...byDate]
    .filter(([, d]) => d.hours > 0)
    .map(([date, d]) => ({
      date,
      humidHours: d.humidHours,
      humidTemp: d.humidHours ? d.humidSum / d.humidHours : null,
      wetHours: d.wetHours,
    }))
}

export function qualifiesBlast(day: BlastDaySummary, wetHours = BLAST_WET_HOURS): boolean {
  return day.wetHours >= wetHours
}

// `wetHours` is only changed by the backtest script, to compare other thresholds.
export function classifyBlastDays(days: BlastDaySummary[], { wetHours = BLAST_WET_HOURS } = {}): BlastDayRisk[] {
  return classifyRun(
    days,
    (d) => qualifiesBlast(d, wetHours),
    (d) => d.wetHours >= NEAR_WET_HOURS,
  )
}

function blastRun(days: BlastDayRisk[], from: number): BlastDayRisk[] {
  const run: BlastDayRisk[] = []
  for (let i = from; i < days.length && qualifiesBlast(days[i]); i++) run.push(days[i])
  return run
}

function runPhrase(run: BlastDayRisk[]): string {
  const hours = Math.min(...run.map((d) => d.wetHours))
  return `${toBnDigits(run.length)} দিন রোজ ${toBnDigits(hours)} ঘণ্টা ${HUMID}`
}

// Keep every sentence to two lines in the Home header, like late blight's buildReason.
export function buildBlastReason(days: BlastDayRisk[], today: Risk): string {
  const day = days[0]
  if (today === 'danger') return `আগামী ${runPhrase(blastRun(days, 0))}`

  const soon = upcomingDanger(days)
  if (soon !== -1) return `${dangerFrom(days, soon)} থেকে ${runPhrase(blastRun(days, soon))}`

  if (today === 'watch') return `আজ ${toBnDigits(day.wetHours)} ঘণ্টা ${HUMID}, ব্লাস্টের মতো গরম`
  if (day.humidHours === 0 || day.humidTemp === null) return `আজ আর্দ্রতা ${toBnDigits(HUMID_RH)}% ছোঁবে না, ঝুঁকি কম`
  // Humid, but mostly too cold or too hot for blast.
  if (day.wetHours * 2 < day.humidHours) {
    const tooCold = day.humidTemp < WET_MIN_C
    return `ভেজা সময়ে ${bnTemp(day.humidTemp)} — ব্লাস্টের জন্য ${tooCold ? 'ঠান্ডা' : 'বেশি গরম'}`
  }
  return `আজ মাত্র ${toBnDigits(day.wetHours)} ঘণ্টা ${HUMID}, ঝুঁকি কম`
}

export const BLAST_DECISION: Record<Risk, string> = {
  safe: 'আগামী কয়েক দিন ঝুঁকি কম। শুধু শুধু ওষুধ দিয়ে টাকা নষ্ট করবেন না।',
  watch: 'আবহাওয়া মাঝে মাঝে ভেজা। রোজ সকালে পাতায় চোখের মতো দাগ খুঁজুন।',
  danger: 'ব্লাস্ট ছড়ানোর মতো আবহাওয়া চলছে। আজই পাতা আর শীষ পরীক্ষা করুন।',
}

// `today` (YYYY-MM-DD) drops days that are already over, after classifying, as assessRisk does.
export function assessBlast(hourly: HourlyForecast, today?: string): RiskAssessment {
  const days = classifyBlastDays(summarizeBlastDays(hourly)).filter((d) => !today || d.date >= today)
  if (days.length === 0) throw new Error('Forecast has no days from today onward')
  const risk = overallRisk(days)
  return { today: risk, days, reason: buildBlastReason(days, risk) }
}
