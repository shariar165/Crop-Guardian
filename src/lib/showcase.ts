// Showcase mode: for a demo day (e.g. a competition's final round), the app works without signing in.
// Set SHOWCASE_UNTIL=YYYY-MM-DD; through that date (Bangladesh time) every visitor can use /account
// and /officer as a showcase agriculture officer, and cases upload without an account. It switches
// itself off the day after, so it can't be left on by mistake. Unset or invalid means off.
import { isIsoDate, todayIn } from '@/lib/dates'
import { formatBdPhone } from '@/lib/phone'

// The account that cases sent and reviewed in showcase mode belong to. It has no phone number, so
// no one can ever sign in as it, and its stored role is farmer.
export const SHOWCASE_USER_ID = 'showcase'

export function showcaseUntil(env: Record<string, string | undefined> = process.env): string | null {
  const until = env.SHOWCASE_UNTIL?.trim()
  return until && isIsoDate(until) ? until : null
}

export function showcaseActive(env: Record<string, string | undefined> = process.env, today = todayIn()): boolean {
  const until = showcaseUntil(env)
  return until !== null && today <= until
}

// Who is signed in, as /account and /officer show it: the number, or for the showcase officer (who
// has none) a name that says it is a demo.
export const SHOWCASE_NAME = 'ডেমো কর্মকর্তা'

export function viewerLabel(user: { phoneNumber: string | null }, showcase: boolean): string {
  return showcase ? SHOWCASE_NAME : formatBdPhone(user.phoneNumber)
}
