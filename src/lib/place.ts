// The farmer's place on the server, from the union cookie set on /planting.
import 'server-only'
import { cookies } from 'next/headers'
import { type Place, placeOf, UNION_COOKIE, unionById } from '@/lib/unions'

export async function getPlace(): Promise<Place> {
  return placeOf(unionById((await cookies()).get(UNION_COOKIE)?.value))
}
