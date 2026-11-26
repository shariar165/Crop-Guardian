import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'
import { showcaseActive } from '@/lib/showcase'

// Sends signed-out visitors of the account screens to sign-in. Optimistic: it only checks the
// session cookie is there; the pages check the session itself (src/lib/auth/session.ts).
// Nothing else needs an account, so the diagnosis flow keeps working offline and signed out.
// In showcase mode the pages let anyone in as the showcase officer, so this must not redirect first.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request) || showcaseActive()) return NextResponse.next()
  const url = new URL('/sign-in', request.url)
  url.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/account', '/officer/:path*'] }
