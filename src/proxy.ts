import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

// Sends signed-out visitors of the account screens to sign-in. Optimistic: it only checks the
// session cookie is there; the pages check the session itself (src/lib/auth/session.ts).
// Nothing else needs an account, so the diagnosis flow keeps working offline and signed out.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()
  const url = new URL('/sign-in', request.url)
  url.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/account', '/officer/:path*'] }
