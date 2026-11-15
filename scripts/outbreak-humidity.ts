// The outbreak half of docs/rule-comparison.md, called from compare-blight-rules.ts: the dated
// late-blight reports (src/lib/outbreaks.ts) next to the 7-day moving sum of humid hours at the BMD
// stations around the app's districts (NOAA ISD), winters 2016–17 to 2024–25. It chooses no
// threshold; it shows what level the sum had reached before each report.
import { districtById, upazilaById } from '@/lib/areas'
import { addDays } from '@/lib/dates'
import { fetchStationHourly, ISD_STATIONS, type IsdStation } from '@/lib/isd'
import { classifyJhulsaDays, MILD_MAX_C, MILD_MIN_C, movingSums, type MovingSum, SEVEN_DAY, summarizeJhulsaDays } from '@/lib/jhulsacast'
import { BLIGHT_REPORTS, type BlightReport, winterOf } from '@/lib/outbreaks'
import { HUMID_RH } from '@/lib/risk'

const WINTERS = Array.from({ length: 9 }, (_, i) => 2016 + i)
const LEVELS = [60, 75, 90, SEVEN_DAY.humidHours]
const LOOK_BACK = [14, 7]
// A station further than this from a report's place is not used for it.
const MAX_KM = 60
const TIMEOUT_MS = 60_000

type StationWinter = {
  station: IsdStation
  winter: number
  allDays: string[]
  fullDays: Set<string>
  sums: Map<string, MovingSum>
  // Windows ending 1 Dec to the end of February.
  windows: string[]
  jhulsacast: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const short = (iso: string) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
const label = (w: number) => `${w}–${String(w + 1).slice(2)}`
const winterDays = (w: number) => {
  const out: string[] = []
  for (let d = `${w}-12-01`; d < `${w + 1}-03-01`; d = addDays(d, 1)) out.push(d)
  return out
}

async function load(station: IsdStation, winter: number): Promise<StationWinter> {
  const allDays = winterDays(winter)
  // From 1 Nov, so a window ending in early December, and JHULSACAST's run, have their days.
  const hourly = await fetchStationHourly(station.id, `${winter}-11-01`, allDays.at(-1)!, TIMEOUT_MS)
  const days = summarizeJhulsaDays(hourly)
  const sums = movingSums(days, SEVEN_DAY.days)
  const inWinter = new Set(allDays)
  const fired = classifyJhulsaDays(days).find((d) => inWinter.has(d.date) && d.risk === 'danger')
  return {
    station,
    winter,
    allDays,
    fullDays: new Set(days.map((d) => d.date).filter((d) => inWinter.has(d))),
    sums,
    windows: allDays.filter((d) => sums.has(d)),
    jhulsacast: fired?.date ?? null,
  }
}

const firstReach = (sw: StationWinter, level: number) => sw.windows.find((d) => sw.sums.get(d)!.humidHours >= level) ?? null
const maxOf = (sw: StationWinter, key: keyof MovingSum) =>
  sw.windows.reduce<{ date: string; hours: number } | null>((best, d) => {
    const h = sw.sums.get(d)![key]
    return !best || h > best.hours ? { date: d, hours: h } : best
  }, null)

function ranges(dates: string[]): string {
  const runs: string[][] = []
  for (const d of dates) {
    const run = runs.at(-1)
    if (run && addDays(run.at(-1)!, 1) === d) run.push(d)
    else runs.push([d])
  }
  return runs.map((r) => (r.length === 1 ? short(r[0]) : `${short(r[0])} – ${short(r.at(-1)!)}`)).join(', ')
}

function coverageTable(all: StationWinter[]): string[] {
  const cell = (s: IsdStation, w: number) => {
    const sw = all.find((x) => x.station === s && x.winter === w)!
    return sw.fullDays.size === 0 ? '—' : String(sw.fullDays.size)
  }
  // Days missing at most stations: gaps in the archive rather than at one station.
  const shared = WINTERS.map((w) => {
    const sws = all.filter((x) => x.winter === w)
    const missing = sws[0].allDays.filter((d) => sws.filter((x) => !x.fullDays.has(d)).length >= Math.ceil(sws.length * 0.75))
    return `- ${label(w)}: ${missing.length === 0 ? 'none' : missing.length === sws[0].allDays.length ? 'the whole winter' : ranges(missing)}`
  })
  return [
    `Days with a full day of readings, of the ${winterDays(2016).length}–${winterDays(2019).length} days from 1 Dec to the end of February (— none).`,
    '',
    `| Station (WMO) | ${WINTERS.map(label).join(' | ')} |`,
    `|---|${WINTERS.map(() => '--:').join('|')}|`,
    ...ISD_STATIONS.map((s) => `| ${s.name} (${s.wmo}) | ${WINTERS.map((w) => cell(s, w)).join(' | ')} |`),
    '',
    'Days missing at three quarters of the stations or more, by winter:',
    '',
    ...shared,
  ]
}

function sumsTable(all: StationWinter[]): string[] {
  const rows = all
    .filter((sw) => sw.windows.length > 0)
    .map((sw) => {
      const humid = maxOf(sw, 'humidHours')!
      const mild = maxOf(sw, 'mildHours')!
      return `| ${label(sw.winter)} | ${sw.station.name} | ${sw.fullDays.size} | ${sw.windows.length} | ${humid.hours} (${short(humid.date)}) | ${mild.hours} | ${sw.jhulsacast ? short(sw.jhulsacast) : 'never'} |`
    })
  return [
    '| Winter | Station | Full days | 7-day windows | Max humid hours (ending) | Max mild hours | JHULSACAST fires |',
    '|---|---|--:|--:|---|--:|---|',
    ...rows,
  ]
}

function calendarTable(): string[] {
  const kind = { outbreak: 'Outbreak', little: 'Little disease', warning: 'Warning' }
  return [
    '| Published | Kind | Report | Places the text puts it in | Earliest date of disease implied | On what |',
    '|---|---|---|---|---|---|',
    ...BLIGHT_REPORTS.map((r) => {
      const places = [...r.places.map((p) => p.name), ...(r.alsoNamed.length ? [`also: ${r.alsoNamed.join(', ')}`] : [])].join('; ') || '—'
      const earliest = r.kind === 'warning' ? '—' : r.earliest
      return `| ${r.published} | ${kind[r.kind]} | ${r.source}: [${r.title}](${r.url}) | ${places} | ${earliest} | ${r.basis} |`
    }),
  ]
}

const toRad = (x: number) => (x * Math.PI) / 180
function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// An upazila's centroid, or a district's as the mean of its upazilas'.
function placeAt(area: string): { lat: number; lon: number } {
  const u = upazilaById(area)
  if (u) return { lat: u.lat, lon: u.lon }
  const d = districtById(area)
  if (!d) throw new Error(`No area ${area}`)
  return { lat: d.upazilas.reduce((s, x) => s + x.lat, 0) / d.upazilas.length, lon: d.upazilas.reduce((s, x) => s + x.lon, 0) / d.upazilas.length }
}

type Check = { report: BlightReport; places: string[]; station: IsdStation | null; km: number; skipped: string[]; at: (number | null)[]; reached: string }

// For each report and the station nearest each of its places: the 7-day sum 14 and 7 days before the
// earliest date it implies. The station is chosen as in usableTable (full readings on the 14 days
// before); nearer ones without them are named.
function checks(all: StationWinter[]): Check[] {
  const out: Check[] = []
  for (const report of BLIGHT_REPORTS.filter((r) => r.kind !== 'warning')) {
    const w = winterOf(report.earliest)
    const byStation = new Map<string, Check>()
    for (const place of report.places.filter((p) => p.area)) {
      const at = placeAt(place.area!)
      const near = ISD_STATIONS.map((s) => ({ s, d: km(at, s) }))
        .filter((x) => x.d <= MAX_KM)
        .sort((a, b) => a.d - b.d)
      const skipped: string[] = []
      let chosen: { s: IsdStation; d: number } | null = null
      for (const x of near) {
        const sw = all.find((y) => y.station === x.s && y.winter === w)!
        if (fullBefore(sw, report.earliest)) {
          chosen = x
          break
        }
        skipped.push(x.s.name)
      }
      const key = chosen?.s.id ?? `none:${place.name}`
      const existing = byStation.get(key)
      if (existing) {
        existing.places.push(place.name)
        continue
      }
      const sw = chosen && all.find((y) => y.station === chosen!.s && y.winter === w)!
      const reached = sw
        ? LEVELS.filter((l) => {
            const d = firstReach(sw, l)
            return d !== null && d <= addDays(report.earliest, -LOOK_BACK.at(-1)!)
          })
            .map((l) => `${l} (${short(firstReach(sw, l)!)})`)
            .join(', ') || 'none'
        : '—'
      byStation.set(key, {
        report,
        places: [place.name],
        station: chosen?.s ?? null,
        km: chosen?.d ?? 0,
        skipped,
        at: LOOK_BACK.map((n) => sw?.sums.get(addDays(report.earliest, -n))?.humidHours ?? null),
        reached,
      })
    }
    out.push(...byStation.values())
  }
  return out
}

function checkTable(all: StationWinter[]): string[] {
  return [
    `| Report | Kind | Places | Station (km) | Earliest implied | 7-day sum ${LOOK_BACK.map((n) => `${n} days before`).join(' | 7-day sum ')} | Levels already reached ${LOOK_BACK.at(-1)} days before (first date) |`,
    `|---|---|---|---|---|${LOOK_BACK.map(() => '--:').join('|')}|---|`,
    ...checks(all).map((c) => {
      const station = c.station ? `${c.station.name} (${Math.round(c.km)})${c.skipped.length ? `; gaps at ${c.skipped.join(', ')}` : ''}` : `no station data${c.skipped.length ? ` (${c.skipped.join(', ')})` : ''}`
      return `| ${c.report.published}, ${c.report.source} | ${c.report.kind === 'little' ? 'Little disease' : 'Outbreak'} | ${c.places.join('; ')} | ${station} | ${c.report.earliest} | ${c.at.map((v) => (v === null ? '—' : String(v))).join(' | ')} | ${c.reached} |`
    }),
  ]
}

function quietWinters(all: StationWinter[]): string[] {
  const reported = new Set(BLIGHT_REPORTS.filter((r) => r.kind === 'outbreak').map((r) => winterOf(r.earliest)))
  const rows: string[] = []
  for (const w of WINTERS.filter((x) => !reported.has(x))) {
    const warnings = BLIGHT_REPORTS.filter((r) => r.kind === 'warning' && winterOf(r.published) === w)
    const sws = all.filter((x) => x.winter === w && x.windows.length > 0)
    const note = warnings.length ? ` (warning only: ${warnings.map((r) => `${r.published}, ${r.source}`).join('; ')})` : ''
    if (sws.length === 0) rows.push(`| ${label(w)}${note} | no station data | — | — |`)
    sws.forEach((sw, i) => {
      const m = maxOf(sw, 'humidHours')!
      rows.push(`| ${i === 0 ? `${label(w)}${note}` : ''} | ${sw.station.name} | ${sw.windows.length} | ${m.hours} (${short(m.date)}) |`)
    })
  }
  return ['| Winter | Station | 7-day windows | Max 7-day humid hours (ending) |', '|---|---|--:|---|', ...rows]
}

// The 14 days before a date, all with full readings at the station.
const fullBefore = (sw: StationWinter, date: string) => Array.from({ length: LOOK_BACK[0] }, (_, i) => addDays(date, -i - 1)).every((d) => sw.fullDays.has(d))

// Which reports can be checked at all: the nearest station (to any place the report names) with full
// readings on each of the 14 days before its earliest implied date.
function usableTable(all: StationWinter[]): { table: string[]; usable: number; total: number } {
  const reports = BLIGHT_REPORTS.filter((r) => r.kind !== 'warning')
  let usable = 0
  const rows = reports.map((r) => {
    const w = winterOf(r.earliest)
    const near = r.places
      .filter((p) => p.area)
      .flatMap((p) => ISD_STATIONS.map((s) => ({ s, d: km(placeAt(p.area!), s) })))
      .filter((x) => x.d <= MAX_KM)
      .sort((a, b) => a.d - b.d)
      .filter((x, i, xs) => xs.findIndex((y) => y.s === x.s) === i)
    const chosen = near.find((x) => fullBefore(all.find((y) => y.station === x.s && y.winter === w)!, r.earliest))
    const without = near.filter((x) => !chosen || x.d < chosen.d).map((x) => `${x.s.name} (${Math.round(x.d)})`)
    if (chosen) usable++
    return `| ${r.published}, ${r.source} | ${r.earliest} | ${chosen ? `${chosen.s.name} (${Math.round(chosen.d)} km)` : 'no station data'} | ${without.join(', ') || '—'} |`
  })
  return {
    table: ['| Report | Earliest implied | Nearest station with 14 full days before it | Nearer stations without them (km) |', '|---|---|---|---|', ...rows],
    usable,
    total: reports.length,
  }
}

// A crossing after a missing window may have happened earlier, inside the gap.
function crossing(sw: StationWinter, level: number): string {
  const d = firstReach(sw, level)
  if (!d) return sw.windows.length < sw.allDays.length ? 'never†' : 'never'
  const gapBefore = sw.allDays.some((x) => x < d && !sw.sums.has(x))
  return `${short(d)}${gapBefore ? '†' : ''}`
}

const earliestOutbreak = (w: number) => BLIGHT_REPORTS.filter((r) => r.kind === 'outbreak' && winterOf(r.earliest) === w).sort((a, b) => a.earliest.localeCompare(b.earliest))[0] ?? null

function baselineTables(all: StationWinter[]): string[] {
  const summary = WINTERS.map((w) => {
    const sws = all.filter((x) => x.winter === w && x.windows.length > 0)
    const outbreak = earliestOutbreak(w)
    const cells = LEVELS.map((l) => {
      const offsets = sws
        .map((sw) => firstReach(sw, l))
        .filter((d): d is string => d !== null)
        .map((d) => Math.round((Date.parse(d) - Date.parse(`${w}-12-01`)) / 86_400_000))
        .sort((a, b) => a - b)
      if (offsets.length === 0) return sws.length ? `never (0 of ${sws.length})` : '—'
      return `${short(addDays(`${w}-12-01`, offsets[Math.floor((offsets.length - 1) / 2)]))} (${offsets.length} of ${sws.length})`
    })
    return `| ${label(w)} | ${outbreak ? `${short(outbreak.earliest)} (${outbreak.source})` : 'none found'} | ${cells.join(' | ')} |`
  })
  const rows = all
    .filter((sw) => sw.windows.length > 0)
    .map((sw) => {
      const outbreak = earliestOutbreak(sw.winter)
      return `| ${label(sw.winter)} | ${sw.station.name} | ${sw.windows.length} | ${LEVELS.map((l) => crossing(sw, l)).join(' | ')} | ${outbreak ? short(outbreak.earliest) : '—'} |`
    })
  return [
    `Per winter: the earliest date of disease any report implies, and the median date the 7-day sum first reached each level across the stations with data (how many of them reached it). Each median is over the stations that reached that level, so the medians need not rise with the level.`,
    '',
    `| Winter | Earliest implied outbreak | First ≥ ${LEVELS.join(', median | First ≥ ')}, median |`,
    `|---|---|${LEVELS.map(() => '---').join('|')}|`,
    ...summary,
    '',
    `Per station-winter. † marks a date with a missing 7-day window before it (the station's record has a gap), so the level may have been reached earlier, inside the gap.`,
    '',
    `| Winter | Station | 7-day windows (of ~90) | First ≥ ${LEVELS.join(' | First ≥ ')} | Earliest implied outbreak |`,
    `|---|---|--:|${LEVELS.map(() => '---').join('|')}|---|`,
    ...rows,
  ]
}

// The stations near the places of the 4 Feb 2025 report, that winter.
function feb2025(all: StationWinter[]): string {
  const parts = ['Rangpur', 'Dinajpur', 'Saidpur'].map((name) => {
    const sw = all.find((x) => x.station.name === name && x.winter === 2024)!
    if (sw.windows.length === 0) return `${name}: no data`
    const max = maxOf(sw, 'humidHours')!
    const reached = firstReach(sw, SEVEN_DAY.humidHours)
    return `${name}: largest 7-day sum ${max.hours} h (ending ${short(max.date)}), ${reached ? `first ≥ ${SEVEN_DAY.humidHours} on ${short(reached)}` : `never ≥ ${SEVEN_DAY.humidHours}`}, JHULSACAST ${sw.jhulsacast ? `fired ${short(sw.jhulsacast)}` : 'never fired'} (${sw.windows.length} windows)`
  })
  return `In 2024–25, when Mithapukur and Nilphamari reported disease on 4 Feb 2025: ${parts.join('; ')}.`
}

export async function outbreakSection(): Promise<string[]> {
  const all: StationWinter[] = []
  for (const station of ISD_STATIONS) for (const w of WINTERS) all.push(await load(station, w))
  console.log(`Outbreak section: ${all.length} station-winters, ${all.filter((x) => x.windows.length > 0).length} with 7-day windows`)
  const usable = usableTable(all)

  return [
    '## Outbreak reports and the 7-day humid sum',
    '',
    `JHULSACAST's 7-day condition (≥ ${SEVEN_DAY.humidHours} hours at RH ≥ ${HUMID_RH}% in 7 days) first fired on station data on the same days late blight was already in the news (Rangpur and Dinajpur, 17–18 Jan 2024). ` +
      'This section sets the dated reports beside the 7-day sum at the nearest station, to show what level it had reached before them. It chooses no level.',
    '',
    '> No report for a winter is not evidence of no disease: these are the reports we could find and open. Reports also lag the disease, and most give no date for when it began, so the "earliest implied" date is usually the publication date and the disease is older than that.',
    '',
    '### The reports',
    '',
    'Each entry records what the report itself says (`src/lib/outbreaks.ts`). Warnings say the weather favours late blight; they report no disease. Doses in the bulletins are left out. Reports that could not be opened (a 2023 Business Post article whose site now redirects elsewhere) are not used.',
    '',
    ...calendarTable(),
    '',
    "The 3 Jan 2024 BAMIS line is the same sentence in the advice for all 14 of the bulletin's regions, from Rangpur to Sylhet and Barishal: it marks the whole country, not the potato districts.",
    '',
    '### Which reports can be checked',
    '',
    `A report can be checked when a station within ${MAX_KM} km of a place it names has full readings on each of the ${LOOK_BACK[0]} days before its earliest implied date. ${usable.usable} of ${usable.total} reports can.`,
    '',
    ...usable.table,
    '',
    '### Station coverage',
    '',
    `Every BMD station in ISD within 30 km of a union the app covers, except Dhaka airport (METAR only, dew point in whole degrees). Readings as in the section above: each 3-hourly SYNOP reading stands for 3 hours, and a day counts only when all 24 hours are covered.`,
    '',
    ...coverageTable(all),
    '',
    'The 7 Jan – 19 Feb 2020 gap is in NOAA\'s copy, not at the stations: it falls on the same days at every station, and [OGIMET](https://www.ogimet.com/)\'s SYNOP archive has Rangpur (41859) for those days, 334 reports over all 44 days (30 days with all 8, 11 with 7; 303 reports with both temperature and dew point; checked on 15 Nov 2026 for that one station-period only). It is not used here.',
    '',
    '### The 7-day sum each winter',
    '',
    `The moving sum of hours at RH ≥ ${HUMID_RH}% over the 7 days ending each day, for windows ending 1 Dec to the end of February whose 7 days all have full readings; the same for hours at ${MILD_MIN_C}–${MILD_MAX_C}°C; and the first day JHULSACAST fired (with station rain).`,
    '',
    ...sumsTable(all),
    '',
    '### Before each report',
    '',
    `For each report of disease (or of little disease), the 7-day humid sum ${LOOK_BACK.join(' and ')} days before the earliest date it implies, at the station nearest each place it names that has full readings on the ${LOOK_BACK[0]} days before (as above; nearer stations with gaps are named). A sum is — when its own 7 days reach into a gap. Stations more than ${MAX_KM} km away are not used.`,
    '',
    ...checkTable(all),
    '',
    feb2025(all),
    '',
    '### A calendar baseline: is it humidity, or just January?',
    '',
    'The reports cluster in January, so the date alone may predict them as well as the humid sum does. If the sum carries information, winters where it crosses a level early should have early reports (1 Jan 2018) and late crossings late ones (4 Feb 2025); if the crossing falls on about the same date every winter, the sum says little more than the calendar.',
    '',
    ...baselineTables(all),
    '',
    '### Winters with no outbreak report found',
    '',
    "The season's largest 7-day humid sum at each station with data. A high sum here and no report is not a false alarm: the disease may have come unreported, or reports may exist that we did not find.",
    '',
    ...quietWinters(all),
    '',
    '### What this does and does not show',
    '',
    '- It shows the 7-day humid sum each station had reached before each dated report, and how often each level was reached in winters with and without reports.',
    `- It does not give the date late blight began anywhere: the reports give their own date, and only ${BLIGHT_REPORTS.filter((r) => r.kind !== 'warning' && !/^(publication date|dateline)/.test(r.basis)).length} of them give an earlier one.`,
    '- It cannot tell a level that warns from one that is reached every winter: with reports in only some winters, and no record of the days without disease, a level that is always reached will look like it "came before" every report.',
    '- The stations are points; a report names a district or upazila up to the distance shown from its station.',
    '- Gaps in the station record (above) fall on some of the report dates; those rows use the next station within range or say there is none.',
  ]
}
