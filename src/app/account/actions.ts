'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { saveAlert, signedInUserId, updateAlert } from '@/lib/alertDb'
import { unionById } from '@/lib/areas'
import { requireUser } from '@/lib/auth/session'
import { validFields } from '@/lib/fieldList'
import { UNION_COOKIE } from '@/lib/placeCookies'

// Turns the farmer's SMS risk alerts on or off, for the union on this phone and the fields it
// sends (the phone keeps them; the server can't read localStorage). Returns false without a union.
export async function setAlerts(enabled: boolean, fields: unknown): Promise<boolean> {
  const { user, showcase } = await requireUser('/account')
  // The showcase officer has no phone to text.
  if (showcase) return false
  const union = unionById((await cookies()).get(UNION_COOKIE)?.value)
  if (!union) return false
  await saveAlert(user.id, { enabled: enabled === true, unionId: union.id, fields: validFields(fields) })
  revalidatePath('/account')
  revalidatePath('/')
  return true
}

// After the phone's fields change, so alerts follow the crops in the field. Nothing when signed
// out or without alerts.
export async function syncAlertFields(fields: unknown): Promise<void> {
  const userId = await signedInUserId()
  if (userId) await updateAlert(userId, { fields: validFields(fields) })
}
