// What a farmer's phone may upload as a case (POST /api/cases), checked before it reaches the database.
import type { Answer, AnswerRecord } from '@/lib/captureStore'
import type { Decision } from '@/lib/diagnosis/decide'
import { unionById } from '@/lib/areas'
import { type CropId, isCropId } from '@/lib/crops'

export const MAX_PHOTO_BYTES = 1_500_000
const DECISIONS: Decision[] = ['confident', 'uncertain', 'unknown']
const ANSWERS: Answer[] = ['yes', 'no', 'unsure']
const ID = /^[a-z_]{1,40}$/
// A case sent more than a season ago, or from the future, is a broken clock or a forged request.
const MAX_AGE_MS = 120 * 86_400_000
const MAX_SKEW_MS = 86_400_000

export type CaseUpload = {
  sentAt: Date
  crop: CropId
  unionId: string | null
  decision: Decision
  candidates: string[]
  finalId: string | null
  answers: AnswerRecord[]
}

// The officer's check, so far for potato cases only: the map counts confirmed late blight.
export type Verdict = 'late_blight' | 'not_late_blight'
export const VERDICTS: Verdict[] = ['late_blight', 'not_late_blight']
export const isVerdict = (v: unknown): v is Verdict => VERDICTS.includes(v as Verdict)

// The parsed case, or why it was refused.
export function parseCaseUpload(json: unknown, now = Date.now()): CaseUpload | { error: string } {
  if (typeof json !== 'object' || json === null) return { error: 'case must be an object' }
  const c = json as Record<string, unknown>

  const sentAt = typeof c.sentAt === 'number' ? c.sentAt : NaN
  if (!Number.isFinite(sentAt) || sentAt < now - MAX_AGE_MS || sentAt > now + MAX_SKEW_MS) return { error: 'bad sentAt' }

  // Phones from before paddy send no crop: theirs are potato cases.
  const crop = c.crop ?? 'potato'
  if (!isCropId(crop)) return { error: 'bad crop' }

  // Stored by its full id, also when the phone still has an old bare Shibganj one.
  const union = typeof c.unionId === 'string' ? unionById(c.unionId) : undefined
  if (c.unionId != null && !union) return { error: 'unknown unionId' }
  const unionId = union?.id ?? null

  if (!DECISIONS.includes(c.decision as Decision)) return { error: 'bad decision' }
  const decision = c.decision as Decision

  const candidates = c.candidates
  if (!Array.isArray(candidates) || candidates.length > 10 || !candidates.every((x) => typeof x === 'string' && ID.test(x))) {
    return { error: 'bad candidates' }
  }

  const finalId = c.finalId ?? null
  if (finalId !== null && !(typeof finalId === 'string' && candidates.includes(finalId))) return { error: 'bad finalId' }

  const answers = c.answers
  if (
    !Array.isArray(answers) ||
    answers.length > 10 ||
    !answers.every(
      (a) => typeof a?.question === 'string' && ID.test(a.question) && ANSWERS.includes(a.answer as Answer),
    )
  ) {
    return { error: 'bad answers' }
  }

  return {
    sentAt: new Date(sentAt),
    crop,
    unionId,
    decision,
    candidates: candidates as string[],
    finalId: finalId as string | null,
    answers: (answers as AnswerRecord[]).map(({ question, answer }) => ({ question, answer })),
  }
}

// JPEG files start with FF D8 FF.
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}
