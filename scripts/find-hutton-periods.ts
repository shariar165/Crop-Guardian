// Lists every day in the last three Dec–Feb winters at Shibganj that the risk engine calls danger,
// using observed weather from the Open-Meteo archive. Used to pick a real date for Home's ?replay=.
// Run: npx tsx scripts/find-hutton-periods.ts
import { classifyDays, summarizeDays } from '@/lib/risk'
import type { DayRisk } from '@/lib/risk'
import { addDays, DEFAULT_LOCATION, fetchHourlyArchive, todayIn } from '@/lib/weather'

const WINTERS = 3
const TIMEOUT_MS = 30_000

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

async function main() {
  const { lat, lon } = DEFAULT_LOCATION
  console.log(`Hutton periods at Shibganj (${lat}, ${lon}), observed weather\n`)

  for (const { start, end } of lastWinters(todayIn())) {
    const days = classifyDays(summarizeDays(await fetchHourlyArchive(lat, lon, start, end, TIMEOUT_MS)))
    const runs = periods(days)
    console.log(`Winter ${start} → ${end}: ${days.length} days of data, ${runs.length} Hutton period(s)`)
    for (const run of runs) {
      const span = run.length === 1 ? run[0].date : `${run[0].date} → ${run.at(-1)!.date}`
      console.log(
        `  ${span}  (${run.length} days)  min ${range(run.map((d) => d.minTemp), '°C')}, RH≥90% ${range(run.map((d) => d.humidHours), ' h')}`,
      )
    }
    console.log()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
