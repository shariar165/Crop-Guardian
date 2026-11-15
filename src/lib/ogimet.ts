// SYNOP reports from OGIMET's archive (https://www.ogimet.com), decoded into the same readings as
// NOAA ISD (src/lib/isd.ts). Used only by the backtest, to fill NOAA's gap at Rangpur in Jan–Feb 2020
// (scripts/stationData.ts). From each land report (AAXX) it takes:
//   section 1: 1snTTT air temperature, 2snTdTdTd dew point (or 29UUU relative humidity);
//   section 3: 7RRRR, the 24-hour rain in tenths of a millimetre (9999 is a trace, read as 0).
import type { IsdReading } from '@/lib/isd'

export const OGIMET_URL = 'https://www.ogimet.com/cgi-bin/getsynop'
const UTC_OFFSET_H = 6
const SECTION = /^(222|333|444|555)/

// "1snTTT": sign 0 is positive, 1 negative; tenths of a degree. Anything else is missing.
function signed(group: string): number | null {
  if (!/^\d[01]\d{3}$/.test(group)) return null
  const v = Number(group.slice(2)) / 10
  return group[1] === '1' ? -v : v
}

// The dew point that gives `rh` at `temp`: the Magnus form used by rhFrom, inverted.
export function dewFrom(temp: number, rh: number): number {
  const a = 17.625
  const b = 243.04
  const g = Math.log(rh / 100) + (a * temp) / (b + temp)
  return (b * g) / (a - g)
}

export type Synop = { temp: number | null; dew: number | null; rain24: number | null }

// One AAXX report. Returns null for NIL or malformed reports.
export function decodeSynop(report: string): Synop | null {
  const groups = report.replace(/=+\s*$/, '').trim().split(/\s+/)
  if (groups[0] !== 'AAXX' || groups.length < 5 || groups.includes('NIL')) return null
  // AAXX YYGGi IIiii iRixhVV Nddff, then 00fff when the wind is 99 units or more.
  let i = groups[4]?.slice(3) === '99' ? 6 : 5
  const section1: string[] = []
  for (; i < groups.length && !SECTION.test(groups[i]); i++) section1.push(groups[i])
  const section3: string[] = []
  if (groups[i] === '333') for (i++; i < groups.length && !SECTION.test(groups[i]); i++) section3.push(groups[i])

  const temp = signed(section1.find((g) => g[0] === '1') ?? '')
  const g2 = section1.find((g) => g[0] === '2')
  let dew: number | null = null
  if (g2 && g2[1] === '9' && /^29\d{3}$/.test(g2) && temp !== null) {
    const rh = Number(g2.slice(2))
    if (rh > 0 && rh <= 100) dew = Math.round(dewFrom(temp, rh) * 10) / 10
  } else if (g2) dew = signed(g2)
  const g7 = section3.find((g) => /^7\d{4}$/.test(g))
  const rain24 = g7 ? (g7.slice(1) === '9999' ? 0 : Number(g7.slice(1)) / 10) : null
  return { temp, dew, rain24 }
}

// OGIMET's getsynop CSV ("41859,2020,01,07,00,00,AAXX …=="), as readings in local time with both
// temperature and dew point, in time order.
export function parseOgimet(csv: string): IsdReading[] {
  const readings: IsdReading[] = []
  for (const line of csv.split(/\r?\n/)) {
    const m = line.match(/^\d{5},(\d{4}),(\d{2}),(\d{2}),(\d{2}),(\d{2}),(.*)$/)
    if (!m) continue
    const s = decodeSynop(m[6])
    if (!s || s.temp === null || s.dew === null) continue
    const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]) + UTC_OFFSET_H, Number(m[5])))
    readings.push({ time: t.toISOString().slice(0, 16), temp: s.temp, dew: s.dew, rain24: s.rain24 })
  }
  return readings.sort((a, b) => a.time.localeCompare(b.time))
}

// A station's SYNOP reports from `from` to `to` (UTC, "YYYYMMDDHHmm"). OGIMET answers a refusal or
// an empty period with text and no report lines; that is an error here, not an empty result.
export async function fetchOgimet(wmo: string, from: string, to: string, timeoutMs: number): Promise<IsdReading[]> {
  const res = await fetch(`${OGIMET_URL}?block=${wmo}&begin=${from}&end=${to}`, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`OGIMET responded ${res.status}`)
  const text = await res.text()
  if (!/^\d{5},/m.test(text)) throw new Error(`OGIMET returned no reports: ${text.slice(0, 120)}`)
  return parseOgimet(text)
}
