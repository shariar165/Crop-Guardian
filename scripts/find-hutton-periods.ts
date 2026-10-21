// Lists every day in the last three Dec–Feb winters at Shibganj that the risk engine calls danger,
// using past weather from two sources (the Open-Meteo archive and NASA POWER), how often it would
// alert under the app's rule and a stricter one, and how far the two sources agree.
// Run: npx tsx scripts/find-hutton-periods.ts [--write]   (--write updates docs/risk-backtest.md)
import { writeFileSync } from 'node:fs'
import { ALERT_QUIET_DAYS, alertStats, type AlertStats } from '@/lib/backtest'
import { addDays, todayIn } from '@/lib/dates'
import { classifyDays, HUMID_RH, HUTTON_HUMID_HOURS, MIN_TEMP_C, STRICT_HUMID_HOURS, summarizeDays } from '@/lib/risk'
import type { DayRisk } from '@/lib/risk'
import { DEFAULT_LOCATION, fetchHourlyArchive, fetchHourlyNasaPower, type HourlyForecast } from '@/lib/weather'

const WINTERS = 3
const TIMEOUT_MS = 30_000
const DOC = 'docs/risk-backtest.md'

const RULES = [
  { name: `Hutton, ≥ ${HUTTON_HUMID_HOURS} h (app)`, humidHours: HUTTON_HUMID_HOURS },
  { name: `Stricter, ≥ ${STRICT_HUMID_HOURS} h`, humidHours: STRICT_HUMID_HOURS },
]

type Source = { name: string; fetch: (lat: number, lon: number, start: string, end: string, timeoutMs: number) => Promise<HourlyForecast> }
const SOURCES: Source[] = [
  { name: 'Open-Meteo archive', fetch: fetchHourlyArchive },
  { name: 'NASA POWER', fetch: fetchHourlyNasaPower },
]

type Row = { winter: string; source: string; rule: string; days: number; stats: AlertStats }
// Danger days under the app's rule: on every source, and on each source alone.
type Agreement = { winter: string; both: number; only: number[] }

// The last `WINTERS` winters that are fully over: Dec 1 to the end of February.
function lastWinters(today: string): { start: string; end: string }[] {
  const year = Number(today.slice(0, 4))
  const lastFebYear = Number(today.slice(5, 7)) >= 3 ? year : year - 1
  return Array.from({ length: WINTERS }, (_, i) => {
    const y = lastFebYear - WINTERS + 1 + i
    return { start: `${y - 1}-12-01`, end: addDays(`${y}-03-01`, -1) }
  })
}

// Consecutive runs of danger days.
function periods(days: DayRisk[]): DayRisk[][] {
  const runs: DayRisk[][] = []
  for (const day of days.filter((d) => d.risk === 'danger')) {
    const run = runs.at(-1)
    if (run && addDays(run.at(-1)!.date, 1) === day.date) run.push(day)
    else runs.push([day])
  }
  return runs
}

const range = (xs: number[], unit: string) => {
  const [lo, hi] = [Math.min(...xs), Math.max(...xs)]
  return lo === hi ? `${lo}${unit}` : `${lo}–${hi}${unit}`
}

const avgGap = (s: AlertStats) => (s.avgGapDays === null ? '—' : s.avgGapDays.toFixed(1))

function markdown(rows: Row[], agreement: Agreement[], today: string): string {
  const { lat, lon } = DEFAULT_LOCATION
  const lines = [
    '# Late-blight risk backtest',
    '',
    `How often the risk engine would have alerted at Shibganj, Bogura (${lat}, ${lon}) in the last ${WINTERS} winters (Dec–Feb), using past weather from two sources: ` +
      'the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (reanalysis) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time).',
    '',
    '> These are weather-only counts. They have not been validated against real late-blight outbreak records.',
    '',
    `| Winter | Source | Rule: hours at RH ≥ ${HUMID_RH}% | Danger days | Alerts | Avg. days between alerts |`,
    '|---|---|---|--:|--:|--:|',
    ...rows.map((r) => `| ${r.winter} | ${r.source} | ${r.rule} | ${r.stats.dangerDays} of ${r.days} | ${r.stats.alerts.length} | ${avgGap(r.stats)} |`),
    '',
    '## Do the two sources agree?',
    '',
    `Danger days under the app's rule (${RULES[0].name}).`,
    '',
    `| Winter | On both | ${SOURCES.map((s) => `${s.name} only`).join(' | ')} |`,
    `|---|--:|${SOURCES.map(() => '--:').join('|')}|`,
    ...agreement.map((a) => `| ${a.winter} | ${a.both} | ${a.only.join(' | ')} |`),
    '',
    'Both sources are weather models, not a station in the field, and the rule counts hours of very high humidity, where models differ most. ' +
      'A Bangladesh Meteorological Department station record, and the dates of real outbreaks, would show which is closer.',
    '',
    `A day qualifies when its min temperature is ≥ ${MIN_TEMP_C}°C and RH ≥ ${HUMID_RH}% lasts at least the rule's hours, and is a danger day when the day before or after also qualifies. ` +
      `A new alert is a danger day after at least ${ALERT_QUIET_DAYS} non-danger days; the gap is measured from one alert's start to the next. ` +
      'The app uses the Hutton rule; the stricter one is only compared here.',
    '',
    `Generated on ${today} by \`npx tsx scripts/find-hutton-periods.ts --write\`.`,
    '',
  ]
  return lines.join('\n')
}

async function main() {
  const { lat, lon } = DEFAULT_LOCATION
  const today = todayIn()
  const rows: Row[] = []
  const agreement: Agreement[] = []
  console.log(`Hutton periods at Shibganj (${lat}, ${lon}), past weather\n`)

  for (const { start, end } of lastWinters(today)) {
    const winter = `${start.slice(0, 4)}–${end.slice(2, 4)}`
    const dangerDates: Set<string>[] = []
    for (const source of SOURCES) {
      const summaries = summarizeDays(await source.fetch(lat, lon, start, end, TIMEOUT_MS))
      const runs = periods(classifyDays(summaries))
      console.log(`Winter ${start} → ${end}, ${source.name}: ${summaries.length} days of data, ${runs.length} Hutton period(s)`)
      for (const run of runs) {
        const span = run.length === 1 ? run[0].date : `${run[0].date} → ${run.at(-1)!.date}`
        console.log(
          `  ${span}  (${run.length} days)  min ${range(run.map((d) => d.minTemp), '°C')}, RH≥90% ${range(run.map((d) => d.humidHours), ' h')}`,
        )
      }

      for (const rule of RULES) {
        const days = classifyDays(summaries, { humidHours: rule.humidHours })
        const stats = alertStats(days)
        rows.push({ winter, source: source.name, rule: rule.name, days: summaries.length, stats })
        if (rule === RULES[0]) dangerDates.push(new Set(days.filter((d) => d.risk === 'danger').map((d) => d.date)))
        console.log(`  ${rule.name}: ${stats.dangerDays} danger days, ${stats.alerts.length} alerts, avg gap ${avgGap(stats)} days`)
      }
      console.log()
    }

    const both = [...dangerDates[0]].filter((d) => dangerDates.every((set) => set.has(d))).length
    agreement.push({ winter, both, only: dangerDates.map((set) => set.size - both) })
    console.log(`Danger days on both sources: ${both}; only one: ${SOURCES.map((s, i) => `${s.name} ${dangerDates[i].size - both}`).join(', ')}\n`)
  }

  if (process.argv.includes('--write')) {
    writeFileSync(DOC, markdown(rows, agreement, today))
    console.log(`Wrote ${DOC}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
