import type { NextRequest } from 'next/server'
import { CROPS, isCropId } from '@/lib/crops'
import { daysBetween, isIsoDate, todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { fetchHourlyPast, MAX_PAST_DAYS } from '@/lib/weather'

// The risk of every day from `from` through today at the farmer's place, by `crop`'s rule (potato
// by default), for the season ledger.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const from = params.get('from') ?? ''
  const today = todayIn()
  if (!isIsoDate(from) || from > today) {
    return Response.json({ error: 'from must be a past date, YYYY-MM-DD' }, { status: 400 })
  }
  const crop = params.get('crop') ?? 'potato'
  if (!isCropId(crop)) return Response.json({ error: 'crop must be potato or paddy' }, { status: 400 })

  const place = await getPlace()
  // One day earlier, so a qualifying day before `from` still counts toward a danger run.
  const pastDays = Math.min(daysBetween(from, today) + 1, MAX_PAST_DAYS)
  try {
    const hourly = await fetchHourlyPast(place.lat, place.lon, pastDays)
    const days = CROPS[crop].classify(hourly).filter((d) => d.date >= from && d.date <= today)
    return Response.json({ place: place.name, days })
  } catch (err) {
    console.error('Season weather failed:', err)
    return Response.json({ error: 'Weather unavailable' }, { status: 502 })
  }
}
