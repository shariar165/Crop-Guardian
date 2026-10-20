'use server'

import { revalidatePath } from 'next/cache'
import { requireOfficer } from '@/lib/auth/session'
import { setVerdict } from '@/lib/caseDb'
import { isVerdict } from '@/lib/cases'

// The officer's review of a case: confirmed late blight (counted on the map), not late blight,
// or undone (an empty verdict).
export async function reviewCase(formData: FormData) {
  const { user } = await requireOfficer('/officer')
  const id = Number(formData.get('id'))
  const verdict = formData.get('verdict') ?? ''
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Bad case id')
  if (verdict !== '' && !isVerdict(verdict)) throw new Error('Bad verdict')
  await setVerdict(id, verdict === '' ? null : verdict, user.id)
  revalidatePath('/officer')
  revalidatePath('/map')
}
