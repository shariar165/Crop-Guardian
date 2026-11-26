// Recorded audio for fixed texts: `/audio/<key>.mp3`, played in place of text-to-speech when the
// file is there (ListenButton). The keys are shared with scripts/audio-script.ts, which lists each
// key with the exact Bengali to record in docs/audio-script.md, so a recording can't drift from
// the text it stands for without the script showing it.
import type { CropId } from '@/lib/crops'
import type { Risk } from '@/lib/data'

export const AUDIO_KEY = {
  riskWord: (risk: Risk) => `risk-${risk}`,
  riskTitle: (risk: Risk) => `title-${risk}`,
  decision: (crop: CropId, risk: Risk) => `decision-${crop}-${risk}`,
  intro: (index: number) => `intro-${index + 1}`,
  question: (id: string) => `question-${id}`,
}

export const audioSrc = (key: string) => `/audio/${key}.mp3`

// The keys with a file in public/audio/ (kept in step by audioKeys.test.ts). Only these are
// fetched: asking for a missing file costs a farmer's data and a 404 for nothing.
export const RECORDED: ReadonlySet<string> = new Set<string>([])

// Part of what a ListenButton reads: its text, and the recording that may stand in for it.
export type SpeechPart = { text: string; audio?: string }
