'use server'

import { cookies } from 'next/headers'
import { UNION_COOKIE, unionById } from '@/lib/unions'

const YEAR_S = 365 * 24 * 60 * 60

// Saves the farmer's union for Home's forecast, the map and the cases they send.
export async function chooseUnion(formData: FormData) {
  const union = unionById(String(formData.get('union') ?? ''))
  const jar = await cookies()
  if (!union) {
    jar.delete(UNION_COOKIE)
    return
  }
  // Read by the client too (src/lib/unions.ts clientUnion), so not httpOnly; it holds nothing private.
  jar.set(UNION_COOKIE, union.id, { path: '/', maxAge: YEAR_S, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
}
