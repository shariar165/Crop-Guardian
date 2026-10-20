import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getPhoto } from '@/lib/caseDb'

// A case's leaf photo, for agriculture officers only.
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/cases/[id]/photo/[slot]'>) {
  const session = await getSession().catch((err) => {
    console.error('Session check failed', err)
    return undefined
  })
  if (session === undefined) return new Response(null, { status: 503 })
  if (session?.user.role !== 'officer') return new Response(null, { status: 403 })

  const { id, slot } = await ctx.params
  if (!/^\d+$/.test(id) || (slot !== 'top' && slot !== 'under')) return new Response(null, { status: 404 })

  const photo = await getPhoto(Number(id), slot).catch((err) => {
    console.error('Could not read the photo', err)
    return undefined
  })
  if (photo === undefined) return new Response(null, { status: 503 })
  if (!photo) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(photo), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' },
  })
}
