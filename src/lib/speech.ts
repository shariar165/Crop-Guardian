// Read-aloud settings and safety, shared by ListenButton and /settings. The pure parts (chunks,
// rates) are tested; the rest touches localStorage and speechSynthesis and is client-only.
import { store } from '@/lib/deviceStore'

export type SpeechRate = 'slow' | 'normal'
export const SPEECH_RATE_KEY = 'crop-guardian:speech-rate'
export const RATE: Record<SpeechRate, number> = { slow: 0.75, normal: 0.9 }
export const rateOf = (stored: string | null): number => RATE[stored === 'slow' ? 'slow' : 'normal']

// Set just before the phone's speech engine is asked to read, cleared when it finishes or the
// page is left normally. Still set on the next load means the tab died while reading (seen on an
// Android phone: «This page couldn't load» on every শুনুন), so the next tap explains instead of
// crashing again.
const PENDING_KEY = 'crop-guardian:speech-pending'
export const SPEECH_CRASHED_KEY = 'crop-guardian:speech-crashed'

export function noteSpeechCrash() {
  try {
    if (localStorage.getItem(PENDING_KEY) === null) return
    localStorage.removeItem(PENDING_KEY)
  } catch {
    return
  }
  store(SPEECH_CRASHED_KEY, '1')
}

export function speechStarted() {
  try {
    localStorage.setItem(PENDING_KEY, '1')
  } catch {}
}

export function speechEnded() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {}
}

if (typeof window !== 'undefined') {
  noteSpeechCrash()
  // Leaving or hiding the page while reading is not a crash.
  window.addEventListener('pagehide', speechEnded)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') speechEnded()
  })
}

/**
 * Splits text into pieces of at most `max` characters at sentence ends (। ? ! and line breaks),
 * then at spaces, so no single utterance is long: some phones' engines stop or fail on long text.
 */
export function speechChunks(text: string, max = 200): string[] {
  const sentences = text
    .split(/(?<=[।?!\n])\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  const chunks: string[] = []
  for (const sentence of sentences) {
    let rest = sentence
    while (rest.length > max) {
      const cut = rest.lastIndexOf(' ', max)
      const at = cut > 0 ? cut : max
      chunks.push(rest.slice(0, at).trim())
      rest = rest.slice(at).trim()
    }
    if (rest) chunks.push(rest)
  }
  return chunks
}

// Android Chrome often returns no voices on the first call and fills them in a moment later.
export function loadedVoices(synth: SpeechSynthesis, waitMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const now = synth.getVoices()
  if (now.length > 0) return Promise.resolve(now)
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      synth.removeEventListener('voiceschanged', done)
      resolve(synth.getVoices())
    }
    const timer = setTimeout(done, waitMs)
    synth.addEventListener('voiceschanged', done)
  })
}

export const bengaliVoice = (voices: SpeechSynthesisVoice[]) => voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('bn'))
