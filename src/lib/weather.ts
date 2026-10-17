const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

export const FORECAST_TZ = 'Asia/Dhaka'
export const FORECAST_DAYS = 5
export const FETCH_TIMEOUT_MS = 5000
export const REVALIDATE_S = 3600
// Past weather barely changes once published.
export const ARCHIVE_REVALIDATE_S = 86400

// Shibganj, Bogura.
export const DEFAULT_LOCATION = { lat: 25.02, lon: 89.32 }

export type HourlyForecast = {
  time: string[] // local time in FORECAST_TZ, e.g. "2026-10-18T05:00"
  temperature: (number | null)[]
  humidity: (number | null)[]
}

type OpenMeteoResponse = {
  hourly?: { time?: unknown; temperature_2m?: unknown; relative_humidity_2m?: unknown }
}

function hourlyParams(lat: number, lon: number): URLSearchParams {
  return new URLSearchParams({
    // ~1 km precision is plenty for weather and lets nearby requests share a cache entry.
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    hourly: 'temperature_2m,relative_humidity_2m',
    timezone: FORECAST_TZ,
  })
}

async function fetchHourly(url: string, revalidate: number, timeoutMs: number): Promise<HourlyForecast> {
  const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`)

  const { hourly } = (await res.json()) as OpenMeteoResponse
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

export function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast> {
  const params = hourlyParams(lat, lon)
  params.set('forecast_days', String(FORECAST_DAYS))
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

// Today's calendar date (YYYY-MM-DD) in the given time zone.
export function todayIn(timeZone: string = FORECAST_TZ): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// A real calendar date written as YYYY-MM-DD. Date rolls 2025-02-30 over to March, so round-trip it.
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}
