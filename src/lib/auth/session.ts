// The real auth check, for server components and route handlers. src/proxy.ts only looks for the
// cookie; this reads the session from the database.
import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth, type Session } from '@/lib/auth/auth'

export const getSession = cache(async (): Promise<Session | null> => auth.api.getSession({ headers: await headers() }))

// `path` is where to come back to after signing in.
export async function requireUser(path: string): Promise<Session> {
  const session = await getSession()
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(path)}`)
  return session
}

export async function requireOfficer(path: string): Promise<Session> {
  const session = await requireUser(path)
  if (session.user.role !== 'officer') redirect('/')
  return session
}
