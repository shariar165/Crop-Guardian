// Station readings for the backtest scripts: NOAA ISD, with OGIMET's SYNOP reports filling the one gap
// we have checked them for (Rangpur, Jan–Feb 2020, where NOAA's copy misses 7 Jan – 19 Feb). ISD's
// readings always win; OGIMET only adds readings at times ISD lacks.
import { addDays } from '@/lib/dates'
import { fetchStationHourly, type IsdReading, type IsdStation, parseIsd, fetchIsdYear } from '@/lib/isd'
import { fetchOgimet } from '@/lib/ogimet'
import type { HourlyForecast } from '@/lib/weather'

// Local dates. OGIMET is asked for the whole two months, so the days ISD has check it.
export const OGIMET_FILLS = [{ id: '41859099999', wmo: '41859', from: '2020-01-01', to: '2020-02-29' }]

const utc = (localDate: string, hhmm: string) => `${localDate.replaceAll('-', '')}${hhmm}`

async function ogimetFor(fill: (typeof OGIMET_FILLS)[number], timeoutMs: number): Promise<IsdReading[]> {
  // Local midnight is 18:00 UTC the day before.
  const readings = await fetchOgimet(fill.wmo, utc(addDays(fill.from, -1), '1800'), utc(fill.to, '1800'), timeoutMs)
  return readings.filter((r) => r.time.slice(0, 10) >= fill.from && r.time.slice(0, 10) <= fill.to)
}

export async function stationSeries(station: IsdStation, start: string, end: string, timeoutMs: number): Promise<HourlyForecast> {
  const fills = OGIMET_FILLS.filter((f) => f.id === station.id && f.from <= end && f.to >= start)
  const extra = (await Promise.all(fills.map((f) => ogimetFor(f, timeoutMs)))).flat()
  return fetchStationHourly(station.id, start, end, timeoutMs, extra)
}

export type FillCheck = { station: string; from: string; to: string; shared: number; sameTemp: number; sameDew: number; sharedRain: number; sameRain: number; added: number }

// How OGIMET compares with ISD on the readings both have, and how many it adds.
export async function checkFills(timeoutMs: number): Promise<FillCheck[]> {
  const out: FillCheck[] = []
  for (const fill of OGIMET_FILLS) {
    const years = [...new Set([Number(addDays(fill.from, -1).slice(0, 4)), Number(fill.to.slice(0, 4))])]
    const isd = new Map<string, IsdReading>()
    for (const y of years) for (const r of parseIsd(await fetchIsdYear(fill.id, y, timeoutMs))) isd.set(r.time, r)
    const og = await ogimetFor(fill, timeoutMs)
    const shared = og.filter((r) => isd.has(r.time))
    const rain = shared.filter((r) => r.time.endsWith('09:00') && r.rain24 !== null && isd.get(r.time)!.rain24 !== null)
    out.push({
      station: fill.wmo,
      from: fill.from,
      to: fill.to,
      shared: shared.length,
      sameTemp: shared.filter((r) => isd.get(r.time)!.temp === r.temp).length,
      sameDew: shared.filter((r) => isd.get(r.time)!.dew === r.dew).length,
      sharedRain: rain.length,
      sameRain: rain.filter((r) => isd.get(r.time)!.rain24 === r.rain24).length,
      added: og.length - shared.length,
    })
  }
  return out
}
