// Observed weather from Bangladesh Meteorological Department synoptic stations, as NOAA's Integrated
// Surface Database (ISD, "global hourly") carries it. Used only by the backtest, to measure how far
// the reanalyses' humidity is from a station's (scripts/compare-blight-rules.ts).
//
// BMD stations report every 3 hours (FM-12 SYNOP at 00, 03, … 21 UTC, so 06, 09, … 03 local). Each
// reading stands for the 3 hours from its time; when one reading is missing, the one before stands
// for 6. RH comes from temperature and dew point (Magnus). Rain is the 24-hour total reported at
// 09:00 local (03 UTC), put on the day before, which holds 15 of its 24 hours.
import { addDays } from '@/lib/dates'
import type { HourlyForecast } from '@/lib/weather'

export const ISD_URL = 'https://noaa-global-hourly-pds.s3.amazonaws.com'
const UTC_OFFSET_H = 6
const STEP_H = 3
const MAX_COVER_H = 6
const RAIN_HOUR_LOCAL = 9

export type IsdReading = { time: string; temp: number; dew: number; rain24: number | null } // time: local "YYYY-MM-DDTHH:MM"

function csvCells(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') quoted = !quoted
    else if (ch === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else cell += ch
  }
  cells.push(cell)
  return cells
}

// "+0155,1" → 15.5. ISD's missing value is ±9999; quality codes 2, 3, 6 and 7 mark suspect or
// erroneous readings.
function tenths(field: string | undefined): number | null {
  const [value, quality] = (field ?? '').split(',')
  if (!value || /^[+-]?9999$/.test(value) || ['2', '3', '6', '7'].includes(quality)) return null
  return Number(value) / 10
}

// The 24-hour rain total in an AA1/AA2 field ("24,0028,3,1" → 2.8 mm), or null.
function rain24(fields: (string | undefined)[]): number | null {
  for (const f of fields) {
    const [period, depth, , quality] = (f ?? '').split(',')
    if (period === '24' && depth && depth !== '9999' && !['2', '3', '6', '7'].includes(quality)) return Number(depth) / 10
  }
  return null
}

// UTC "2020-01-01T18:00:00" → local "2020-01-02T00:00".
function toLocal(utc: string): string {
  const d = new Date(utc.slice(0, 19) + 'Z')
  d.setUTCHours(d.getUTCHours() + UTC_OFFSET_H)
  return d.toISOString().slice(0, 16)
}

// The SYNOP readings with both temperature and dew point, in time order.
export function parseIsd(csv: string): IsdReading[] {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []
  const header = csvCells(lines[0])
  const col = (name: string) => header.indexOf(name)
  const [date, type, tmp, dew, aa1, aa2] = ['DATE', 'REPORT_TYPE', 'TMP', 'DEW', 'AA1', 'AA2'].map(col)
  if (date < 0 || tmp < 0 || dew < 0) throw new Error('ISD file without DATE, TMP and DEW')
  const readings: IsdReading[] = []
  for (const line of lines.slice(1)) {
    const c = csvCells(line)
    if (type >= 0 && c[type].trim() !== 'FM-12') continue
    const t = tenths(c[tmp])
    const d = tenths(c[dew])
    if (t === null || d === null) continue
    readings.push({ time: toLocal(c[date]), temp: t, dew: d, rain24: rain24([c[aa1], c[aa2]]) })
  }
  return readings.sort((a, b) => a.time.localeCompare(b.time))
}

// Relative humidity (%) from temperature and dew point (°C), Magnus form (Alduchov & Eskridge 1996).
export function rhFrom(temp: number, dew: number): number {
  const es = (t: number) => Math.exp((17.625 * t) / (t + 243.04))
  return Math.min(100, (100 * es(dew)) / es(temp))
}

const hourIndex = (start: string, time: string) => Math.round((Date.parse(time + ':00Z') - Date.parse(start + 'T00:00:00Z')) / 3_600_000)

// An hourly series in local time over start..end (inclusive dates), with each reading spread over
// the hours it stands for. Days with any hour not covered are dropped, so every day left has 24 hours.
export function stationHourly(readings: IsdReading[], start: string, end: string): HourlyForecast {
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1
  const n = days * 24
  const time = Array.from({ length: n }, (_, i) => `${addDays(start, Math.floor(i / 24))}T${String(i % 24).padStart(2, '0')}:00`)
  const temperature: (number | null)[] = Array(n).fill(null)
  const humidity: (number | null)[] = Array(n).fill(null)
  const precipitation: (number | null)[] = Array(n).fill(null)
  readings.forEach((r, k) => {
    const from = hourIndex(start, r.time)
    const next = readings[k + 1] ? hourIndex(start, readings[k + 1].time) : from + STEP_H
    const to = Math.min(next, from + MAX_COVER_H, n)
    for (let i = Math.max(from, 0); i < to; i++) {
      temperature[i] = r.temp
      humidity[i] = rhFrom(r.temp, r.dew)
    }
    if (r.rain24 !== null && r.time.slice(11, 13) === String(RAIN_HOUR_LOCAL).padStart(2, '0')) {
      const noonBefore = hourIndex(start, `${addDays(r.time.slice(0, 10), -1)}T12:00`)
      if (noonBefore >= 0 && noonBefore < n) precipitation[noonBefore] = r.rain24
    }
  })
  const complete = new Set<string>()
  for (let d = 0; d < days; d++) {
    const hours = Array.from({ length: 24 }, (_, h) => d * 24 + h)
    if (hours.every((i) => temperature[i] !== null && humidity[i] !== null)) complete.add(time[d * 24].slice(0, 10))
  }
  const keep = time.map((t) => complete.has(t.slice(0, 10)))
  const pick = <T>(xs: T[]) => xs.filter((_, i) => keep[i])
  return { time: pick(time), temperature: pick(temperature), humidity: pick(humidity), precipitation: pick(precipitation) }
}

// One station-year of ISD, or '' when NOAA has no file for it (yet).
export async function fetchIsdYear(usafWban: string, year: number, timeoutMs: number): Promise<string> {
  const res = await fetch(`${ISD_URL}/${year}/${usafWban}.csv`, { signal: AbortSignal.timeout(timeoutMs) })
  if (res.status === 404 || res.status === 403) return ''
  if (!res.ok) throw new Error(`ISD responded ${res.status}`)
  return res.text()
}

// A BMD station's observed weather for start..end (local dates). WMO 41883 is ISD "41883099999".
export async function fetchStationHourly(wmo: string, start: string, end: string, timeoutMs: number): Promise<HourlyForecast> {
  const years = [...new Set([Number(addDays(start, -1).slice(0, 4)), Number(end.slice(0, 4))])]
  const files = await Promise.all(years.map((y) => fetchIsdYear(`${wmo}099999`, y, timeoutMs)))
  return stationHourly(files.flatMap(parseIsd), start, end)
}
