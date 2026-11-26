// «ফোনের তথ্য মুছুন» in /settings: everything the app keeps on this phone, except the downloaded
// model (30 MB to fetch again, and nothing personal in it) and the sign-in session. Client-only.
import { PLACE_COOKIE, UNION_COOKIE } from '@/lib/placeCookies'

// The IndexedDB database of src/lib/captureStore.ts: photos, results, answers and shared cases.
const DB_NAME = 'crop-guardian'

// localStorage keys: the app's own prefix, and the /ask history from before it was used.
export const isAppKey = (key: string) => key.startsWith('crop-guardian:') || key === 'cg-ask'

export async function clearPhoneData(): Promise<void> {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => k !== null && isAppKey(k))
    for (const key of keys) localStorage.removeItem(key)
  } catch {}
  for (const name of [UNION_COOKIE, PLACE_COOKIE]) document.cookie = `${name}=; path=/; max-age=0`
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(DB_NAME)
      // Blocked means another tab has it open: it is deleted once that tab lets go.
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
  document.documentElement.removeAttribute('data-text')
}
