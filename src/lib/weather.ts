import { LOCAL_TZ } from '@/lib/dates'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

export const FORECAST_TZ = LOCAL_TZ
export const FORECAST_DAYS = 5
export const FETCH_TIMEOUT_MS = 5000
// Many points in one request take Open-Meteo several seconds (3–4 s for the 13 unions).
export const MANY_TIMEOUT_MS = 15_000
export const REVALIDATE_S = 3600
// Past weather barely changes once published.
export const ARCHIVE_REVALIDATE_S = 86400

// Weather since planting comes from the forecast API's `past_days`, which allows up to 92.
export const MAX_PAST_DAYS = 92

// Shibganj upazila, Bogura, when the farmer hasn't picked a union.
export const DEFAULT_LOCATION = { lat: 25.02, lon: 89.32, name: 'শিবগঞ্জ, বগুড়া' }

export type HourlyForecast = {
  time: string[] // local time in FORECAST_TZ, e.g. "2026-10-18T05:00"
  temperature: (number | null)[]
  humidity: (number | null)[]
}

type OpenMeteoResponse = {
  hourly?: { time?: unknown; temperature_2m?: unknown; relative_humidity_2m?: unknown }
}

// ~1 km precision is plenty for weather and lets nearby requests share a cache entry.
const coord = (n: number) => n.toFixed(2)

function hourlyParams(lat: number | number[], lon: number | number[]): URLSearchParams {
  return new URLSearchParams({
    // Several points, comma-separated, come back as an array of responses.
    latitude: [lat].flat().map(coord).join(','),
    longitude: [lon].flat().map(coord).join(','),
    hourly: 'temperature_2m,relative_humidity_2m',
    timezone: FORECAST_TZ,
  })
}

async function fetchJson(url: string, revalidate: number, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`)
  return res.json()
}

export function parseHourly(body: unknown): HourlyForecast {
  const { hourly } = (body ?? {}) as OpenMeteoResponse
  const time = hourly?.time
  const temperature = hourly?.temperature_2m
  const humidity = hourly?.relative_humidity_2m
  if (
    !Array.isArray(time) ||
    !Array.isArray(temperature) ||
    !Array.isArray(humidity) ||
    temperature.length !== time.length ||
    humidity.length !== time.length
  ) {
    throw new Error('Open-Meteo returned malformed hourly data')
  }
  return { time, temperature, humidity }
}

async function fetchHourly(url: string, revalidate: number, timeoutMs: number): Promise<HourlyForecast> {
  return parseHourly(await fetchJson(url, revalidate, timeoutMs))
}

// One response per point, in the same order. A single point comes back as an object, not an array.
export function parseHourlyMany(body: unknown, count: number): HourlyForecast[] {
  const list = Array.isArray(body) ? body : [body]
  if (list.length !== count) throw new Error(`Open-Meteo returned ${list.length} locations, expected ${count}`)
  return list.map(parseHourly)
}

export function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast> {
  const params = hourlyParams(lat, lon)
  params.set('forecast_days', String(FORECAST_DAYS))
  return fetchHourly(`${FORECAST_URL}?${params}`, REVALIDATE_S, FETCH_TIMEOUT_MS)
}

// The 5-day forecast for several points in one request (the map's unions).
export async function fetchHourlyForecastMany(points: { lat: number; lon: number }[]): Promise<HourlyForecast[]> {
  const params = hourlyParams(
    points.map((p) => p.lat),
    points.map((p) => p.lon),
  )
  params.set('forecast_days', String(FORECAST_DAYS))
  return parseHourlyMany(await fetchJson(`${FORECAST_URL}?${params}`, REVALIDATE_S, MANY_TIMEOUT_MS), points.length)
}

// The last `pastDays` days (modelled, no archive delay) through today, for the season ledger.
export function fetchHourlyPast(lat: number, lon: number, pastDays: number): Promise<HourlyForecast> {
  const params = hourlyParams(lat, lon)
  params.set('past_days', String(Math.min(Math.max(pastDays, 0), MAX_PAST_DAYS)))
  params.set('forecast_days', '1')
  return fetchHourly(`${FORECAST_URL}?${params}`, REVALIDATE_S, FETCH_TIMEOUT_MS)
}

// Observed weather for start..end inclusive, as YYYY-MM-DD local dates.
// Days not yet in the archive come back as nulls.
export function fetchHourlyArchive(
  lat: number,
  lon: number,
  start: string,
  end: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<HourlyForecast> {
  const params = hourlyParams(lat, lon)
  params.set('start_date', start)
  params.set('end_date', end)
  return fetchHourly(`${ARCHIVE_URL}?${params}`, ARCHIVE_REVALIDATE_S, timeoutMs)
}
