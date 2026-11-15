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

// BMD stations within 30 km of a union the app covers, with ISD records in these winters (from
// NOAA's isd-history.csv). Dhaka's airport (41922) is left out: it files only METAR, whose whole-degree
// dew point is too coarse for RH ≥ 90%; Tejgaon covers Dhaka. ISD has no Rajshahi city station after
// 2003; Shah Mokhdum is Rajshahi's airport.
export type IsdStation = { id: string; wmo: string; name: string; lat: number; lon: number }
export const ISD_STATIONS: IsdStation[] = [
  { id: '41850099999', wmo: '41850', name: 'Tetulia', lat: 26.35, lon: 88.6 },
  { id: '41858099999', wmo: '41858', name: 'Saidpur', lat: 25.75, lon: 88.917 },
  { id: '41859099999', wmo: '41859', name: 'Rangpur', lat: 25.733, lon: 89.233 },
  { id: '41862199999', wmo: '418621', name: 'Rajarhat', lat: 25.8, lon: 89.55 },
  { id: '41863099999', wmo: '41863', name: 'Dinajpur', lat: 25.65, lon: 88.683 },
  { id: '41883099999', wmo: '41883', name: 'Bogura', lat: 24.85, lon: 89.367 },
  { id: '41895099999', wmo: '41895', name: 'Rajshahi', lat: 24.437, lon: 88.617 },
  { id: '41907099999', wmo: '41907', name: 'Ishurdi', lat: 24.153, lon: 89.049 },
  { id: '41909099999', wmo: '41909', name: 'Tangail', lat: 24.25, lon: 89.933 },
  { id: '41923099999', wmo: '41923', name: 'Dhaka (Tejgaon)', lat: 23.779, lon: 90.383 },
  { id: '41941099999', wmo: '41941', name: 'Chandpur', lat: 23.267, lon: 90.7 },
]
export const isdStation = (name: string): IsdStation => {
  const s = ISD_STATIONS.find((x) => x.name === name)
  if (!s) throw new Error(`No ISD station ${name}`)
  return s
}

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

// One station-year of ISD, or '' when NOAA has no file for it (yet). The backtest scripts keep each
// file on disk (scripts/fetchCache.ts), so a year read for two winters is downloaded once.
// The bucket sometimes drops a connection partway through a file, so a failed download is retried.
const ISD_ATTEMPTS = 3
export async function fetchIsdYear(id: string, year: number, timeoutMs: number): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${ISD_URL}/${year}/${id}.csv`, { signal: AbortSignal.timeout(timeoutMs) })
      if (res.status === 404 || res.status === 403) return ''
      if (!res.ok) throw new Error(`ISD responded ${res.status}`)
      return await res.text()
    } catch (err) {
      if (attempt >= ISD_ATTEMPTS) throw err
    }
  }
}

// A station's observed weather for start..end (local dates), by ISD id ("41883099999"). The years
// are read one at a time, and only the readings inside the span are kept. `extra` readings (from
// another copy of the same reports) fill only the times ISD lacks.
export async function fetchStationHourly(id: string, start: string, end: string, timeoutMs: number, extra: IsdReading[] = []): Promise<HourlyForecast> {
  const span = [...new Set([Number(addDays(start, -1).slice(0, 4)), Number(end.slice(0, 4))])]
  const from = `${addDays(start, -1)}T00:00`
  const to = `${end}T23:59`
  const readings: IsdReading[] = []
  for (const year of span) {
    for (const r of parseIsd(await fetchIsdYear(id, year, timeoutMs))) if (r.time >= from && r.time <= to) readings.push(r)
  }
  const have = new Set(readings.map((r) => r.time))
  for (const r of extra) if (r.time >= from && r.time <= to && !have.has(r.time)) readings.push(r)
  return stationHourly(readings.sort((a, b) => a.time.localeCompare(b.time)), start, end)
}
