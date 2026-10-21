'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signedInUserId, updateAlert } from '@/lib/alertDb'
import { placeOf, unionById } from '@/lib/areas'
import { PLACE_COOKIE, PLACE_COOKIE_MAX_AGE_S, UNION_COOKIE } from '@/lib/placeCookies'

// Saves the farmer's union for Home's forecast, the map and the cases they send.
export async function chooseUnion(formData: FormData) {
  const union = unionById(String(formData.get('union') ?? ''))
  const jar = await cookies()
  if (!union) {
    jar.delete(UNION_COOKIE)
    jar.delete(PLACE_COOKIE)
    return
  }
  // Read by the client too (src/lib/placeCookies.ts), so not httpOnly; they hold nothing private.
  const options = { path: '/', maxAge: PLACE_COOKIE_MAX_AGE_S, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' } as const
  jar.set(UNION_COOKIE, union.id, options)
  jar.set(PLACE_COOKIE, placeOf(union).name, options)
  // SMS alerts follow the farmer's place. A failure here mustn't stop the choice being saved.
  const userId = await signedInUserId().catch(() => null)
  if (userId) await updateAlert(userId, { unionId: union.id }).catch((err) => console.error('Alert union update failed', err))
  // Back to /planting without the picker's steps, so it shows the place just chosen.
  const next = String(formData.get('next') ?? '')
  if (/^\/planting(\?|$)/.test(next)) redirect(next)
}
