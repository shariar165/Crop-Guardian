import { connection } from 'next/server'
import { showcaseActive } from '@/lib/showcase'

// Whether showcase mode is on today, for pages that stay static (and cached offline) like /camera.
// Never cached: it switches itself off the day after SHOWCASE_UNTIL.
export async function GET() {
  await connection()
  return Response.json({ active: showcaseActive() }, { headers: { 'Cache-Control': 'no-store' } })
}
