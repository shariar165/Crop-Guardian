// The farmer's place, kept in two cookies set on /planting: the union id, so the server can
// forecast for it, and its name, so the phone can say where a case comes from without the area
// index. Neither is httpOnly: they hold nothing private.
import { DEFAULT_LOCATION } from '@/lib/weather'

export const UNION_COOKIE = 'cg-union'
export const PLACE_COOKIE = 'cg-place'
export const PLACE_COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function clientPlace(): { unionId: string | null; name: string } {
  const unionId = readCookie(UNION_COOKIE)
  return { unionId, name: (unionId && readCookie(PLACE_COOKIE)) || DEFAULT_LOCATION.name }
}

// Home keeps the name in step with the union (cookies set before the name cookie existed).
export function rememberPlaceName(name: string) {
  if (readCookie(PLACE_COOKIE) === name) return
  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${PLACE_COOKIE}=${encodeURIComponent(name)}; path=/; max-age=${PLACE_COOKIE_MAX_AGE_S}; samesite=lax${secure}`
}
