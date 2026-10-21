// Lists every day in the last three Boro and Aman seasons at Shibganj that the rice-blast rule
// calls danger, using observed weather from the Open-Meteo archive, and how often it would alert
// under the app's rule and two variants.
// Run: npx tsx scripts/find-blast-periods.ts [--write]   (--write updates docs/blast-backtest.md)
import { writeFileSync } from 'node:fs'
import { ALERT_QUIET_DAYS, alertStats, type AlertStats } from '@/lib/backtest'
import { BLAST_WET_HOURS, classifyBlastDays, summarizeBlastDays, WET_MAX_C, WET_MIN_C } from '@/lib/blast'
import type { BlastDayRisk } from '@/lib/blast'
import { addDays, todayIn } from '@/lib/dates'
import { HUMID_RH } from '@/lib/risk'
import { DEFAULT_LOCATION, fetchHourlyArchive } from '@/lib/weather'

const YEARS = 3
const TIMEOUT_MS = 30_000
const DOC = 'docs/blast-backtest.md'

const RULES = [
  { name: `≥ ${BLAST_WET_HOURS - 2} h (looser)`, wetHours: BLAST_WET_HOURS - 2 },
  { name: `≥ ${BLAST_WET_HOURS} h (app)`, wetHours: BLAST_WET_HOURS },
  { name: `≥ ${BLAST_WET_HOURS + 2} h (stricter)`, wetHours: BLAST_WET_HOURS + 2 },
]

// The part of each season when the crop is most exposed: Boro from establishment to heading
// (Jan–Apr), Aman through the monsoon (Aug–Oct).
const SEASONS = [
  { name: 'Boro', from: '01-01', to: '04-30' },
  { name: 'Aman', from: '08-01', to: '10-31' },
]

type Row = { season: string; rule: string; days: number; stats: AlertStats }

// The last `YEARS` windows of each season that are fully over, oldest first.
function lastSeasons(today: string): { name: string; start: string; end: string }[] {
  const year = Number(today.slice(0, 4))
  return SEASONS.flatMap(({ name, from, to }) => {
    const lastYear = today.slice(5) > to ? year : year - 1
    return Array.from({ length: YEARS }, (_, i) => {
      const y = lastYear - YEARS + 1 + i
      return { name, start: `${y}-${from}`, end: `${y}-${to}` }
    })
  })
}

// Consecutive runs of danger days.
function periods(days: BlastDayRisk[]): BlastDayRisk[][] {
  const runs: BlastDayRisk[][] = []
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

function markdown(rows: Row[], today: string): string {
  const { lat, lon } = DEFAULT_LOCATION
  const lines = [
    '# Rice-blast risk backtest',
    '',
    `How often the draft rice-blast rule would have alerted at Shibganj, Bogura (${lat}, ${lon}) in the last ${YEARS} Boro (Jan–Apr) and Aman (Aug–Oct) seasons, using observed weather from the Open-Meteo archive.`,
    '',
    '> These are weather-only counts. The rule is a draft: it has not been validated against real blast outbreak records, and should be reviewed with BRRI before farmers rely on it.',
    '',
    `| Season | Rule: wet hours | Danger days | Alerts | Avg. days between alerts |`,
    '|---|---|--:|--:|--:|',
    ...rows.map((r) => `| ${r.season} | ${r.rule} | ${r.stats.dangerDays} of ${r.days} | ${r.stats.alerts.length} | ${avgGap(r.stats)} |`),
    '',
    `A wet hour has RH ≥ ${HUMID_RH}% at ${WET_MIN_C}–${WET_MAX_C}°C. A day qualifies when it has at least the rule's wet hours, and is a danger day when the day before or after also qualifies. ` +
      `A new alert is a danger day after at least ${ALERT_QUIET_DAYS} non-danger days; the gap is measured from one alert's start to the next. ` +
      'The app uses the middle rule; the others are only compared here.',
    '',
    `Generated on ${today} by \`npx tsx scripts/find-blast-periods.ts --write\`.`,
    '',
  ]
  return lines.join('\n')
}

async function main() {
  const { lat, lon } = DEFAULT_LOCATION
  const today = todayIn()
  const rows: Row[] = []
  console.log(`Blast periods at Shibganj (${lat}, ${lon}), observed weather\n`)

  for (const { name, start, end } of lastSeasons(today)) {
    const summaries = summarizeBlastDays(await fetchHourlyArchive(lat, lon, start, end, TIMEOUT_MS))
    const runs = periods(classifyBlastDays(summaries))
    console.log(`${name} ${start} → ${end}: ${summaries.length} days of data, ${runs.length} blast period(s)`)
    for (const run of runs) {
      const span = run.length === 1 ? run[0].date : `${run[0].date} → ${run.at(-1)!.date}`
      console.log(`  ${span}  (${run.length} days)  wet ${range(run.map((d) => d.wetHours), ' h')}`)
    }

    const season = `${name} ${start.slice(0, 4)}`
    for (const rule of RULES) {
      const stats = alertStats(classifyBlastDays(summaries, { wetHours: rule.wetHours }))
      rows.push({ season, rule: rule.name, days: summaries.length, stats })
      console.log(`  ${rule.name}: ${stats.dangerDays} danger days, ${stats.alerts.length} alerts, avg gap ${avgGap(stats)} days`)
    }
    console.log()
  }

  if (process.argv.includes('--write')) {
    writeFileSync(DOC, markdown(rows, today))
    console.log(`Wrote ${DOC}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
