const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

export const FORECAST_TZ = 'Asia/Dhaka'
export const FORECAST_DAYS = 5
export const FETCH_TIMEOUT_MS = 5000
export const REVALIDATE_S = 3600

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

export async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyForecast> {
  const params = new URLSearchParams({
    // ~1 km precision is plenty for weather and lets nearby requests share a cache entry.
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    hourly: 'temperature_2m,relative_humidity_2m',
    forecast_days: String(FORECAST_DAYS),
    timezone: FORECAST_TZ,
  })

  const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
    next: { revalidate: REVALIDATE_S },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
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

// Today's calendar date (YYYY-MM-DD) in the given time zone.
export function todayIn(timeZone: string = FORECAST_TZ): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
