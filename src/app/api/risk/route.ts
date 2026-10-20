import type { NextRequest } from 'next/server'
import { todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { assessRisk } from '@/lib/risk'
import { fetchHourlyForecast } from '@/lib/weather'

function parseCoord(value: string | null, fallback: number, limit: number): number | null {
  if (value === null || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

// Today's risk at `lat`/`lon`, by default at the farmer's union (or the upazila when none is set).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const place = await getPlace()
  const lat = parseCoord(params.get('lat'), place.lat, 90)
  const lon = parseCoord(params.get('lon'), place.lon, 180)
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
