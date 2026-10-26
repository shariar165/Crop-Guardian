// The real auth check, for server components and route handlers. src/proxy.ts only looks for the
// cookie; this reads the session from the database. In showcase mode (src/lib/showcase.ts) a
// visitor who isn't signed in gets the showcase officer instead of the sign-in page.
import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth, type Session } from '@/lib/auth/auth'
import { SHOWCASE_USER_ID, showcaseActive } from '@/lib/showcase'

export const getSession = cache(async (): Promise<Session | null> => auth.api.getSession({ headers: await headers() }))

// Who is looking at an account screen: a signed-in user, or the showcase officer.
export type Viewer = { user: { id: string; phoneNumber: string | null; role: string }; showcase: boolean }

const SHOWCASE_VIEWER: Viewer = { user: { id: SHOWCASE_USER_ID, phoneNumber: null, role: 'officer' }, showcase: true }

const viewerOf = ({ user }: Session): Viewer => ({
  user: { id: user.id, phoneNumber: user.phoneNumber ?? null, role: user.role ?? 'farmer' },
  showcase: false,
})

// In showcase mode the database may be the only thing missing a session; that must not block the demo.
async function sessionOrNull(): Promise<Session | null> {
  if (!showcaseActive()) return getSession()
  return getSession().catch((err) => {
    console.error('Session check failed', err)
    return null
  })
}

// `path` is where to come back to after signing in.
export async function requireUser(path: string): Promise<Viewer> {
  const session = await sessionOrNull()
  if (session) return viewerOf(session)
  if (showcaseActive()) return SHOWCASE_VIEWER
  redirect(`/sign-in?next=${encodeURIComponent(path)}`)
}

// A signed-in officer, or in showcase mode anyone else as the showcase officer.
export async function requireOfficer(path: string): Promise<Viewer> {
  const session = await sessionOrNull()
  if (session?.user.role === 'officer') return viewerOf(session)
  if (showcaseActive()) return SHOWCASE_VIEWER
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(path)}`)
  redirect('/')
}
