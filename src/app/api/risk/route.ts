import type { NextRequest } from 'next/server'
import { CROPS, isCropId } from '@/lib/crops'
import { todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { fetchHourlyForecast } from '@/lib/weather'

function parseCoord(value: string | null, fallback: number, limit: number): number | null {
  if (value === null || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

// Today's risk for `crop` (potato by default) at `lat`/`lon`, by default at the farmer's union (or
// Shibganj, Bogura, when none is set).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const crop = params.get('crop') ?? 'potato'
  if (!isCropId(crop)) return Response.json({ error: 'crop must be potato or paddy' }, { status: 400 })
  const place = await getPlace()
  const lat = parseCoord(params.get('lat'), place.lat, 90)
  const lon = parseCoord(params.get('lon'), place.lon, 180)
  if (lat === null || lon === null) {
    return Response.json({ error: 'lat must be within ±90 and lon within ±180' }, { status: 400 })
  }

  try {
    return Response.json(CROPS[crop].assess(await fetchHourlyForecast(lat, lon), todayIn()))
  } catch (err) {
    console.error('Risk forecast failed:', err)
    return Response.json({ error: 'Weather forecast unavailable' }, { status: 502 })
  }
}
