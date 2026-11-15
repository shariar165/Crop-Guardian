// Three late-blight rules side by side over past winters: the app's (Hutton, ≥ 6 h), a stricter one
// (≥ 10 h) and JHULSACAST (src/lib/jhulsacast.ts), from two past-weather sources. For each: danger
// days, danger weeks, the first day it fires, and the calendar sprays the season ledger would count
// as saved. Then the same against three Bangladesh Meteorological Department stations' observed
// humidity (NOAA ISD), with the live app's model replayed (Open-Meteo Historical Forecast), and
// one dated outbreak report, in Lalmonirhat, as a weak check. Last, the dated reports of 2016–17 to
// 2024–25 next to the 7-day humid sum at the stations around the app's districts (outbreak-humidity.ts).
// Run: npx tsx scripts/compare-blight-rules.ts [--write]   (--write updates docs/rule-comparison.md)
import { writeFileSync } from 'node:fs'
import { upazilaById } from '@/lib/areas'
import { SEASONS } from '@/lib/crops'
import { SPRAY_COST } from '@/lib/data'
import { addDays, todayIn } from '@/lib/dates'
import { fitThreshold, humidHoursByDay, monthlyMeans, sampledEvery3h, worstWeek } from '@/lib/humidityGap'
import { fetchStationHourly, isdStation, type IsdStation } from '@/lib/isd'
import { classifyJhulsaDays, FIVE_DAY, LEAD_DAYS, MILD_MAX_C, MILD_MIN_C, SEVEN_DAY, summarizeJhulsaDays } from '@/lib/jhulsacast'
import { buildLedger, WEEK_DAYS } from '@/lib/ledger'
import { cacheFetches } from './fetchCache'
import { outbreakSection } from './outbreak-humidity'
import { classifyDays, HUMID_RH, HUTTON_HUMID_HOURS, MIN_TEMP_C, STRICT_HUMID_HOURS, type StripDay, summarizeDays } from '@/lib/risk'
import {
  DEFAULT_LOCATION,
  fetchHourlyArchive,
  fetchHourlyHistoricalForecast,
  fetchHourlyNasaPower,
  HISTORICAL_FORECAST_FROM,
  type HourlyForecast,
} from '@/lib/weather'

// December of each year to February of the next: the last three, and 2019–20 for the outbreak check.
const WINTERS = [2019, 2023, 2024, 2025]
// The full weeks from 1 Dec that the practice simulator would ask about.
const WEEKS = 12
// Weather from 1 Nov, so a rule can already be firing on 1 Dec (JHULSACAST needs 13 days of data).
const LEAD_IN_FROM = '11-01'
const TIMEOUT_MS = 60_000
const DOC = 'docs/rule-comparison.md'

// One dated report (New Age, 2 Feb 2020, from Lalmonirhat: late blight in the northern districts),
// checked at Lalmonirhat Sadar.
const EVENT = { winter: 2019, date: '2020-02-02', upazila: 'lalmonirhat-sadar' }
const NEW_AGE = 'https://www.newagebd.net/article/98379/late-blight-attack-worries-potato-farmers-in-northern-districts'
const BEFORE_DAYS = 28

type Rule = { name: string; classify: (hourly: HourlyForecast) => StripDay[] }
const RULES: Rule[] = [
  { name: `Hutton, ≥ ${HUTTON_HUMID_HOURS} h (app)`, classify: (h) => classifyDays(summarizeDays(h)) },
  { name: `Stricter, ≥ ${STRICT_HUMID_HOURS} h`, classify: (h) => classifyDays(summarizeDays(h), { humidHours: STRICT_HUMID_HOURS }) },
  { name: 'JHULSACAST', classify: (h) => classifyJhulsaDays(summarizeJhulsaDays(h)) },
]

type Source = { name: string; fetch: (lat: number, lon: number, start: string, end: string, timeoutMs: number) => Promise<HourlyForecast> }
const SOURCES: Source[] = [
  { name: 'Open-Meteo archive', fetch: fetchHourlyArchive },
  { name: 'NASA POWER', fetch: fetchHourlyNasaPower },
]

type Winter = { label: string; from: string; to: string; fetchFrom: string; planting: string; weeksEnd: string }

function winterOf(year: number): Winter {
  const from = `${year}-12-01`
  return {
    label: `${year}–${String(year + 1).slice(2)}`,
    from,
    to: addDays(`${year + 1}-03-01`, -1),
    fetchFrom: `${year}-${LEAD_IN_FROM}`,
    // Planted so the crop is up on 1 Dec, as the ledger counts from emergence.
    planting: addDays(from, -SEASONS.potato.startDays),
    weeksEnd: addDays(from, WEEKS * WEEK_DAYS - 1),
  }
}

type Result = {
  dangerDays: number
  windowDays: number
  // One mark per full week from 1 Dec: ● danger, · none, ? a day of weather missing.
  weekMarks: string
  dangerWeeks: number
  saved: number
  noData: number
  first: string | null
  // The rule was already firing the day before the winter starts.
  carriedIn: boolean
  dangerDates: Set<string>
}

function assess(days: StripDay[], w: Winter): Result {
  const inWinter = days.filter((d) => d.date >= w.from && d.date <= w.to)
  const danger = inWinter.filter((d) => d.risk === 'danger').map((d) => d.date)
  // The ledger's own count over the 12 full weeks, with no sprays logged: a week with a danger day
  // is a miss, a week without one is a calendar spray saved. `today` ends the 12th week.
  const ledger = buildLedger({ planting: w.planting, today: addDays(w.weeksEnd, 1), days, sprays: [], cost: SPRAY_COST })
  const weeks = [...ledger.weeks].reverse().filter((x) => x.end <= w.weeksEnd)
  if (weeks.length !== WEEKS) throw new Error(`Expected ${WEEKS} full weeks, got ${weeks.length}`)
  const mark = { missed: '●', saved: '·', noData: '?' } as Record<string, string>
  return {
    dangerDays: danger.length,
    windowDays: inWinter.length,
    weekMarks: weeks.map((x) => mark[x.kind] ?? x.kind).join(''),
    dangerWeeks: weeks.filter((x) => x.kind === 'missed').length,
    saved: weeks.filter((x) => x.kind === 'saved').length,
    noData: weeks.filter((x) => x.kind === 'noData').length,
    first: danger[0] ?? null,
    carriedIn: danger[0] === w.from && days.some((d) => d.date === addDays(w.from, -1) && d.risk === 'danger'),
    dangerDates: new Set(danger),
  }
}

type Row = { winter: string; source: string; rule: string; r: Result }

// How near JHULSACAST came in a winter: its largest moving sums of humid hours, and the two-day
// spells with enough rain, over windows ending 1 Dec to the end of February.
type Near = { place: string; winter: string; source: string; avgHumid: number; max7: number; max5: number; wetPairs: number }
const nearness: Near[] = []

function nearOf(hourly: HourlyForecast, w: Winter): Omit<Near, 'place' | 'winter' | 'source'> {
  const days = summarizeJhulsaDays(hourly)
  const humid = new Map(days.map((d) => [d.date, d.humidHours]))
  const rain = new Map(days.map((d) => [d.date, d.rainMm ?? 0]))
  const inWinter = days.filter((d) => d.date >= w.from && d.date <= w.to)
  const sumBack = (date: string, n: number) => Array.from({ length: n }, (_, i) => humid.get(addDays(date, -i)) ?? 0).reduce((a, b) => a + b, 0)
  return {
    avgHumid: inWinter.reduce((s, d) => s + d.humidHours, 0) / inWinter.length,
    max7: Math.max(...inWinter.map((d) => sumBack(d.date, SEVEN_DAY.days))),
    max5: Math.max(...inWinter.map((d) => sumBack(d.date, FIVE_DAY.days))),
    wetPairs: inWinter.filter((d) => (rain.get(addDays(d.date, -1)) ?? 0) + (d.rainMm ?? 0) >= FIVE_DAY.rainMm).length,
  }
}

async function rowsAt(lat: number, lon: number, w: Winter, label: string): Promise<Row[]> {
  const rows: Row[] = []
  for (const source of SOURCES) {
    const hourly = await source.fetch(lat, lon, w.fetchFrom, w.to, TIMEOUT_MS)
    const rainHours = hourly.precipitation?.filter((v) => v !== null).length ?? 0
    console.log(`${label} ${w.label}, ${source.name}: ${hourly.time.length} hours, ${rainHours} with rain data`)
    for (const rule of RULES) rows.push({ winter: w.label, source: source.name, rule: rule.name, r: assess(rule.classify(hourly), w) })
    nearness.push({ place: label, winter: w.label, source: source.name, ...nearOf(hourly, w) })
  }
  return rows
}

// "3 Dec", short, for the tables.
const shortDate = (iso: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${Number(iso.slice(8))} ${months[Number(iso.slice(5, 7)) - 1]}`
}

function firstCell(r: Result, rule: string): string {
  if (!r.first) return 'never'
  const date = r.carriedIn ? `${shortDate(r.first)} (already on 30 Nov)` : shortDate(r.first)
  return rule === 'JHULSACAST' ? `${date} → by ${shortDate(addDays(r.first, LEAD_DAYS))}` : date
}

const savedCell = (r: Result) => `${r.saved} of ${WEEKS}${r.noData ? ` (${r.noData} without data)` : ''}`

function mainTable(rows: Row[]): string[] {
  return [
    '| Winter | Source | Rule | Danger days | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires | Sprays saved vs weekly |',
    '|---|---|---|--:|--:|---|---|--:|',
    ...rows.map(
      ({ winter, source, rule, r }) =>
        `| ${winter} | ${source} | ${rule} | ${r.dangerDays} of ${r.windowDays} | ${r.dangerWeeks} of ${WEEKS} | \`${r.weekMarks}\` | ${firstCell(r, rule)} | ${savedCell(r)} |`,
    ),
  ]
}

function nearTable(): string[] {
  return [
    `| Place | Winter | Source | Hours at RH ≥ ${HUMID_RH}%, mean a day | Largest ${SEVEN_DAY.days}-day sum (needs ${SEVEN_DAY.humidHours}) | Largest ${FIVE_DAY.days}-day sum (needs ${FIVE_DAY.humidHours}) | Two-day spells ≥ ${FIVE_DAY.rainMm} mm |`,
    '|---|---|---|--:|--:|--:|--:|',
    ...nearness.map((n) => `| ${n.place} | ${n.winter} | ${n.source} | ${n.avgHumid.toFixed(1)} | ${n.max7} | ${n.max5} | ${n.wetPairs} |`),
  ]
}

// ---- Stations ----

// Three BMD synoptic stations near the potato districts, at the coordinates their ISD records give.
type Station = IsdStation
const STATIONS: Station[] = ['Bogura', 'Rangpur', 'Dinajpur'].map(isdStation)
// The rules are run on a station's winter only when nearly every day of it has readings.
const MIN_RULE_DAYS = 80

type GapSource = { name: string; from?: string; fetch: (s: Station, w: Winter) => Promise<HourlyForecast> }
const STATION_SOURCE = 'Station (ISD)'
const GAP_SOURCES: GapSource[] = [
  { name: STATION_SOURCE, fetch: (s, w) => fetchStationHourly(s.id, w.fetchFrom, w.to, TIMEOUT_MS) },
  { name: 'Open-Meteo archive', fetch: (s, w) => fetchHourlyArchive(s.lat, s.lon, w.fetchFrom, w.to, TIMEOUT_MS) },
  { name: 'Historical forecast', from: HISTORICAL_FORECAST_FROM, fetch: (s, w) => fetchHourlyHistoricalForecast(s.lat, s.lon, w.fetchFrom, w.to, TIMEOUT_MS) },
  { name: 'NASA POWER', fetch: (s, w) => fetchHourlyNasaPower(s.lat, s.lon, w.fetchFrom, w.to, TIMEOUT_MS) },
]
const MODELS = GAP_SOURCES.filter((g) => g.name !== STATION_SOURCE)

type StationWinter = {
  station: Station
  w: Winter
  // Winter days with a full day of station readings; every source is compared on these only.
  days: string[]
  allDays: string[]
  // Each source's series, cut to the station's complete days (lead-in included).
  series: Map<string, HourlyForecast>
  stationHumid: Map<string, number>
}

const datesFrom = (from: string, to: string) => {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

function onlyDays(hourly: HourlyForecast, keep: Set<string>): HourlyForecast {
  const pick = hourly.time.map((t) => keep.has(t.slice(0, 10)))
  const cut = <T>(xs: T[]) => xs.filter((_, i) => pick[i])
  return { time: cut(hourly.time), temperature: cut(hourly.temperature), humidity: cut(hourly.humidity), ...(hourly.precipitation ? { precipitation: cut(hourly.precipitation) } : {}) }
}

async function stationWinter(station: Station, w: Winter): Promise<StationWinter> {
  const observed = await GAP_SOURCES[0].fetch(station, w)
  const complete = new Set(observed.time.map((t) => t.slice(0, 10)))
  const allDays = datesFrom(w.from, w.to)
  const days = allDays.filter((d) => complete.has(d))
  const series = new Map<string, HourlyForecast>([[STATION_SOURCE, observed]])
  if (days.length > 0) {
    for (const source of MODELS) {
      if (source.from && w.from < source.from) continue
      series.set(source.name, onlyDays(await source.fetch(station, w), complete))
    }
  }
  console.log(`${station.name} ${w.label}: ${days.length} of ${allDays.length} winter days with full readings; ${[...series.keys()].join(', ')}`)
  return { station, w, days, allDays, series, stationHumid: humidHoursByDay(observed, HUMID_RH) }
}

// "8 Jan – 18 Feb, 25 Feb" for the winter days without full readings.
function gaps(sw: StationWinter): string {
  const have = new Set(sw.days)
  const runs: string[][] = []
  for (const d of sw.allDays.filter((x) => !have.has(x))) {
    const run = runs.at(-1)
    if (run && addDays(run.at(-1)!, 1) === d) run.push(d)
    else runs.push([d])
  }
  if (runs.length === 0) return 'none'
  const text = runs.map((r) => (r.length === 1 ? shortDate(r[0]) : `${shortDate(r[0])} – ${shortDate(r.at(-1)!)}`))
  return text.length > 6 ? `${text.slice(0, 6).join(', ')} and ${text.length - 6} more` : text.join(', ')
}

function coverageTable(sws: StationWinter[]): string[] {
  return [
    '| Station | Winter | Days with full readings | Days missing |',
    '|---|---|--:|---|',
    ...sws.map((sw) => `| ${sw.station.name} (${sw.station.wmo}) | ${sw.w.label} | ${sw.days.length} of ${sw.allDays.length} | ${sw.days.length === 0 ? 'all (no ISD file yet)' : gaps(sw)} |`),
  ]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`

function monthTable(sws: StationWinter[]): string[] {
  const rows: string[] = []
  for (const sw of sws.filter((x) => x.days.length > 0)) {
    const bySource = GAP_SOURCES.map((g) => {
      const s = sw.series.get(g.name)
      return s ? monthlyMeans(humidHoursByDay(s, HUMID_RH), sw.days) : null
    })
    for (const [i, m] of bySource[0]!.entries()) {
      const cells = bySource.map((b) => (b ? b[i]?.mean.toFixed(1) ?? '—' : '—'))
      rows.push(`| ${sw.station.name} | ${monthLabel(m.month)} | ${m.days} | ${cells.join(' | ')} |`)
    }
  }
  return [`| Station | Month | Days | ${GAP_SOURCES.map((g) => g.name).join(' | ')} |`, `|---|---|--:|${GAP_SOURCES.map(() => '--:').join('|')}|`, ...rows]
}

function worstWeekTable(sws: StationWinter[]): string[] {
  const rows = sws
    .filter((x) => x.days.length > 0)
    .map((sw) => {
      const cells = GAP_SOURCES.map((g) => {
        const s = sw.series.get(g.name)
        const week = s && worstWeek(humidHoursByDay(s, HUMID_RH), sw.days)
        return week ? `${week.hours} h (from ${shortDate(week.start)})` : '—'
      })
      return `| ${sw.station.name} | ${sw.w.label} | ${cells.join(' | ')} |`
    })
  return [`| Station | Winter | ${GAP_SOURCES.map((g) => g.name).join(' | ')} |`, `|---|---|${GAP_SOURCES.map(() => '---').join('|')}|`, ...rows]
}

function ruleCell(r: Result): string {
  const first = r.first ? (r.carriedIn ? `${shortDate(r.first)}, already on 30 Nov` : shortDate(r.first)) : 'never'
  return `${r.dangerWeeks} of ${WEEKS} (${first})${r.noData ? `, ${r.noData} quiet without full data` : ''}`
}

function stationRulesTable(sws: StationWinter[]): string[] {
  const rows: string[] = []
  for (const sw of sws.filter((x) => x.days.length >= MIN_RULE_DAYS)) {
    for (const g of GAP_SOURCES) {
      const s = sw.series.get(g.name)
      if (!s) continue
      rows.push(`| ${sw.station.name} | ${sw.w.label} | ${g.name} | ${RULES.map((rule) => ruleCell(assess(rule.classify(s), sw.w))).join(' | ')} |`)
    }
  }
  return [`| Station | Winter | Source | ${RULES.map((r) => r.name).join(' | ')} |`, `|---|---|---|${RULES.map(() => '---').join('|')}|`, ...rows]
}

function thresholdTable(sws: StationWinter[]): { table: string[]; sampling: string[] } {
  const usable = sws.filter((x) => x.days.length > 0)
  const table = [
    `| Source | Station-days | Station, h/day at RH ≥ ${HUMID_RH}% | Model, h/day at ≥ ${HUMID_RH}% | Model threshold that matches | Model, h/day there | Daily error at ${HUMID_RH}% → there | Threshold, by station-winter |`,
    '|---|--:|--:|--:|--:|--:|---|---|',
  ]
  const sampling: string[] = []
  for (const g of MODELS) {
    const pairs = usable.flatMap((sw) => {
      const model = sw.series.get(g.name)
      return model ? [{ model, station: sw.stationHumid, dates: sw.days, label: `${sw.station.name} ${sw.w.label}` }] : []
    })
    if (pairs.length === 0) continue
    const fit = fitThreshold(pairs)
    const each = pairs.map((p) => fitThreshold([p]).threshold)
    table.push(
      `| ${g.name} | ${fit.days} | ${fit.stationMean.toFixed(1)} | ${fit.modelMeanAt90.toFixed(1)} | **${fit.threshold}%** | ${fit.modelMean.toFixed(1)} | ${fit.maeAt90.toFixed(1)} → ${fit.mae.toFixed(1)} h | ${Math.min(...each)}–${Math.max(...each)}% |`,
    )
    // What reading the model only at the station's 8 times would do to its count.
    const every = pairs.flatMap((p) => {
      const full = humidHoursByDay(p.model, HUMID_RH)
      const sampled = humidHoursByDay(sampledEvery3h(p.model), HUMID_RH)
      return p.dates.filter((d) => full.has(d)).map((d) => sampled.get(d)! - full.get(d)!)
    })
    sampling.push(`${g.name} ${(every.reduce((a, b) => a + b, 0) / every.length).toFixed(2)} h/day`)
  }
  return { table, sampling }
}

function countIn(r: Result, from: string, to: string): number {
  return [...r.dangerDates].filter((d) => d >= from && d <= to).length
}

function eventTable(rows: Row[], w: Winter): string[] {
  const before = addDays(EVENT.date, -BEFORE_DAYS)
  const dayBefore = addDays(EVENT.date, -1)
  const decEnd = `${EVENT.winter}-12-31`
  return [
    `| Source | Rule | Danger days, ${shortDate(before)} – ${shortDate(dayBefore)} | Danger days in December | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires |`,
    '|---|---|--:|--:|--:|---|---|',
    ...rows.map(
      ({ source, rule, r }) =>
        `| ${source} | ${rule} | ${countIn(r, before, dayBefore)} of ${BEFORE_DAYS} | ${countIn(r, w.from, decEnd)} of 31 | ${r.dangerWeeks} of ${WEEKS} | \`${r.weekMarks}\` | ${firstCell(r, rule)} |`,
    ),
  ]
}

function markdown(main: Row[], event: Row[], sws: StationWinter[], outbreak: string[], place: { name: string; lat: number; lon: number }, today: string): string {
  const { lat, lon } = DEFAULT_LOCATION
  const ew = winterOf(EVENT.winter)
  const fit = thresholdTable(sws)
  const eventGaps = sws.filter((sw) => sw.w.label === ew.label && ['Rangpur', 'Dinajpur'].includes(sw.station.name)).map((sw) => `${sw.station.name} ${gaps(sw)}`)
  return [
    '# Late-blight rules compared',
    '',
    `Three weather rules for late blight replayed at Shibganj, Bogura (${lat}, ${lon}) over the winters ${WINTERS.map((y) => winterOf(y).label).join(', ')} (1 Dec to the end of February), ` +
      'from two past-weather sources: the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (its default model here is ECMWF IFS at 9 km, the model the live app\'s forecast uses) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time). ' +
      'The app uses the first rule; the other two are only compared here.',
    '',
    '> Weather-only counts. None of these rules has been validated against late-blight records in Bangladesh. The outbreak reports below are dated news reports and bulletins, not a validation.',
    '',
    '## The rules',
    '',
    `- **Hutton, ≥ ${HUTTON_HUMID_HOURS} h (app)**: a day qualifies when its minimum temperature is ≥ ${MIN_TEMP_C}°C and RH ≥ ${HUMID_RH}% lasts ≥ ${HUTTON_HUMID_HOURS} hours; a qualifying day next to another is a danger day.`,
    `- **Stricter, ≥ ${STRICT_HUMID_HOURS} h**: the same with ≥ ${STRICT_HUMID_HOURS} hours.`,
    '- **JHULSACAST** (CPRI, tuned with 7 years of station weather at Kalyani, West Bengal; Sharma, [Potato Journal 42(1)](https://epubs.icar.org.in/index.php/PotatoJ/article/view/47731)). ' +
      `Late blight first appears within ${LEAD_DAYS} days when either holds: the ${SEVEN_DAY.days}-day moving sums of hours at RH ≥ ${HUMID_RH}% (≥ ${SEVEN_DAY.humidHours}) and hours at ${MILD_MIN_C}–${MILD_MAX_C}°C (≥ ${SEVEN_DAY.mildHours}) hold for ${SEVEN_DAY.days} consecutive days; ` +
      `or the ${FIVE_DAY.days}-day sums (≥ ${FIVE_DAY.humidHours} and ≥ ${FIVE_DAY.mildHours}) hold for ${FIVE_DAY.days} consecutive days and the rain on two consecutive days sums to ≥ ${FIVE_DAY.rainMm} mm. ` +
      `A danger day here is a day either condition is met on. Two readings of the abstract: a moving sum covers the last n calendar days including the day, and the two rainy days lie within the ${FIVE_DAY.days} days the condition holds. ` +
      'Rain is Open-Meteo `precipitation` and NASA POWER `PRECTOTCORR`. Weather is fetched from 1 Nov, so any rule can already be firing on 1 Dec.',
    '',
    '## Shibganj',
    '',
    ...mainTable(main),
    '',
    `**Danger weeks** and **Sprays saved** come from the season ledger (\`buildLedger\`) over the ${WEEKS} full weeks from 1 Dec (the crop planted on ${shortDate(winterOf(WINTERS[0]).planting)}), with no sprays logged: ` +
      'a week with a danger day is one the farmer should have sprayed, and a week without one is a calendar spray saved against spraying every week. ' +
      `In the week marks, ● is a danger week and · a quiet one. For JHULSACAST, "→ by" is the latest date its forecast gives for the disease to appear (${LEAD_DAYS} days).`,
    '',
    '## Why JHULSACAST never fires here',
    '',
    `Its ${SEVEN_DAY.days}-day condition needs ${SEVEN_DAY.humidHours} hours at RH ≥ ${HUMID_RH}% in a week, about ${Math.round(SEVEN_DAY.humidHours / SEVEN_DAY.days)} hours a day, held for ${SEVEN_DAY.days} days running. ` +
      `Its ${FIVE_DAY.days}-day condition needs ${FIVE_DAY.humidHours} hours in 5 days, held for 5 days running, with rain, and these are dry winters. ` +
      `The temperature condition also fails in cold spells, when nights drop below ${MILD_MIN_C}°C, but humidity alone rules the rule out: no week came near ${SEVEN_DAY.humidHours} hours.`,
    '',
    ...nearTable(),
    '',
    'JHULSACAST was tuned on station humidity at Kalyani; both sources here are models. The next section measures how far their humidity is from three stations.',
    '',
    '## Stations: the humidity gap',
    '',
    'Observed weather from three Bangladesh Meteorological Department synoptic stations, from NOAA\'s [Integrated Surface Database](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database) (ISD, FM-12 SYNOP reports, on the [NOAA open-data bucket](https://noaa-global-hourly-pds.s3.amazonaws.com/index.html)), ' +
      'against three models read at each station\'s coordinates: the Open-Meteo archive, the [Open-Meteo Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api) (the model the live app\'s forecast comes from, replayed; from 2022 only) and NASA POWER.',
    '',
    '- The stations report every 3 hours (00, 03, … 21 UTC). **Each reading stands for the 3 hours from its time**, so a reading at RH ≥ 90% counts as 3 humid hours; when one reading is missing, the one before stands for 6. A day counts only when all its 24 hours are covered.',
    '- RH is computed from temperature and dew point (Magnus form). The rules\' rain is the 24-hour total reported at 09:00 local, put on the day before.',
    '- Every source is compared on the station\'s days only, so a gap in the station record is a gap for all four.',
    "- The Open-Meteo archive and Historical Forecast columns agree to the hour: at these places both APIs' default is ECMWF IFS at 9 km, which is also what the live forecast's default returns (checked on the raw responses against `models=ecmwf_ifs`). So the archive used throughout this report already is the live app's model; ERA5 (`models=era5`) is a different series and is not used here.",
    '- Meteostat\'s bulk data was checked and not used: for these stations it is model output, not observations (at the SYNOP hours of Jan–Feb 2024, 8 of 478 temperatures matched ISD; Dinajpur is not in it).',
    '',
    '### Coverage',
    '',
    ...coverageTable(sws),
    '',
    `### Hours a day at RH ≥ ${HUMID_RH}%, by month`,
    '',
    ...monthTable(sws),
    '',
    '### The most humid week',
    '',
    `The 7 consecutive station days with the most hours at RH ≥ ${HUMID_RH}% (JHULSACAST's 7-day condition needs ${SEVEN_DAY.humidHours}).`,
    '',
    ...worstWeekTable(sws),
    '',
    '### The rules on station data',
    '',
    `Danger weeks out of the ${WEEKS} full weeks from 1 Dec (first day the rule fires), for station-winters with at least ${MIN_RULE_DAYS} days of full readings, with the models at the same place and on the same days. ` +
      'A quiet week with a day missing is not counted as quiet.',
    '',
    ...stationRulesTable(sws),
    '',
    `### Which model threshold matches the station's ${HUMID_RH}%`,
    '',
    `For each model, the RH threshold (in 0.5% steps) at which its mean humid hours a day, Dec–Feb, equal the stations' hours at RH ≥ ${HUMID_RH}%, pooled over every station-day above. Reported, not applied: the app still counts hours at ${HUMID_RH}% on its forecast.`,
    '',
    ...fit.table,
    '',
    `Counting a model only at the station's 8 reading times, as the station is counted, changes its mean by ${fit.sampling.join(', ')}: the 3-hour sampling alone does not explain the gap.`,
    '',
    `## One dated report: Lalmonirhat, ${EVENT.winter}–${String(EVENT.winter + 1).slice(2)}`,
    '',
    `New Age, ${shortDate(EVENT.date)} 2020, from Lalmonirhat: [Late blight attack worries potato farmers in northern districts](${NEW_AGE}) (Rezaul Karim Manik), naming Rangpur, Kurigram, Lalmonirhat, Gaibandha, Dinajpur, Nilphamari, Thakurgaon and Panchagarh, after prolonged cold and dense fog; it gives no date for when the disease appeared. ` +
      'The Daily Star had already reported late blight in Thakurgaon Sadar and Panchagarh\'s Boda upazila on 21 Jan 2020 ([Late blight attack worries potato growers](https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268)), so the outbreak began some time before the report. ' +
      `The Rangpur and Dinajpur stations can't speak to it: their records for that winter miss ${eventGaps.join('; ')}. ` +
      `Weather at Lalmonirhat Sadar (${place.lat}, ${place.lon}), with the ${BEFORE_DAYS} days before the report:`,
    '',
    ...eventTable(event, ew),
    '',
    'A rule that fired in the weeks before the report agrees with it; a rule that was also firing all December and January would have agreed with any date. ' +
      'One report gives neither the date the disease first appeared nor the days without it, so it cannot show which rule is right.',
    '',
    ...outbreak,
    '',
    `Generated on ${today} by \`npx tsx scripts/compare-blight-rules.ts --write\`.`,
    '',
  ].join('\n')
}

async function main() {
  cacheFetches()
  const today = todayIn()
  const main: Row[] = []
  for (const year of WINTERS) main.push(...(await rowsAt(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, winterOf(year), 'Shibganj')))

  const upazila = upazilaById(EVENT.upazila)
  if (!upazila) throw new Error(`No upazila ${EVENT.upazila}`)
  const place = { name: upazila.nameEn, lat: upazila.lat, lon: upazila.lon }
  const event = await rowsAt(place.lat, place.lon, winterOf(EVENT.winter), place.name)

  const sws: StationWinter[] = []
  for (const station of STATIONS) for (const year of WINTERS) sws.push(await stationWinter(station, winterOf(year)))
  const outbreak = await outbreakSection()

  console.log()
  console.log(mainTable(main).join('\n'))
  console.log()
  console.log(eventTable(event, winterOf(EVENT.winter)).join('\n'))
  for (const table of [coverageTable(sws), monthTable(sws), worstWeekTable(sws), stationRulesTable(sws), thresholdTable(sws).table]) console.log('\n' + table.join('\n'))

  if (process.argv.includes('--write')) {
    writeFileSync(DOC, markdown(main, event, sws, outbreak, place, today))
    console.log(`\nWrote ${DOC}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
