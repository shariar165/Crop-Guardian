import type { NextRequest } from 'next/server'
import { assessRisk } from '@/lib/risk'
import { DEFAULT_LOCATION, fetchHourlyForecast, todayIn } from '@/lib/weather'

function parseCoord(value: string | null, fallback: number, limit: number): number | null {
  if (value === null || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const lat = parseCoord(params.get('lat'), DEFAULT_LOCATION.lat, 90)
  const lon = parseCoord(params.get('lon'), DEFAULT_LOCATION.lon, 180)
  if (lat === null || lon === null) {
    return Response.json({ error: 'lat must be within ±90 and lon within ±180' }, { status: 400 })
  }

  try {
    return Response.json(assessRisk(await fetchHourlyForecast(lat, lon), todayIn()))
  } catch (err) {
    console.error('Risk forecast failed:', err)
    return Response.json({ error: 'Weather forecast unavailable' }, { status: 502 })
  }
}
