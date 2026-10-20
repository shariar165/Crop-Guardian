// Sends a case to the agriculture officer through the phone's own share sheet (photos + a short
// Bengali summary), or a WhatsApp text link where sharing isn't available. Sent cases are kept on
// the device for the ledger, and uploaded for the officer's list and the map when signed in.
import { bnDate } from '@/lib/bn'
import { type CaseRecord, type DiagnosisRecord, getCapture, getCases, putCase, saveCase } from '@/lib/captureStore'
import type { DiagnosisConfig } from '@/lib/diagnosis/config'
import { CONFIDENCE_WORD, labelOf, orList, photoLine } from '@/lib/diagnosis/explain'
import { finalOf } from '@/lib/diagnosis/flow'
import { answerLine } from '@/lib/diagnosis/questions'
import { clientUnion, placeOf } from '@/lib/unions'

export const SHARE_TITLE = 'Crop Guardian — আলুর পাতা'

// The app's result in a few words, e.g. "নিশ্চিত — নাবি ধসা".
export function caseVerdict({ result }: DiagnosisRecord, config: DiagnosisConfig): string {
  return result.decision === 'confident'
    ? `${CONFIDENCE_WORD.confident} — ${labelOf(result.candidates[0], config)}`
    : result.decision === 'uncertain'
      ? `${CONFIDENCE_WORD.uncertain} — ${orList(result.candidates, config)}`
      : CONFIDENCE_WORD.unknown
}

export function caseSummary(record: DiagnosisRecord, config: DiagnosisConfig, date: string, place: string): string {
  const final = finalOf(record)
  return [
    `${SHARE_TITLE} (পরীক্ষামূলক অ্যাপ)`,
    `তারিখ: ${bnDate(date)}`,
    `এলাকা: ${place}`,
    `অ্যাপের ফল: ${caseVerdict(record, config)}`,
    photoLine(record.result, config),
    ...record.answers.flatMap((a) => answerLine(a) ?? []),
    ...(final?.via === 'questions' ? [`উত্তর মিলিয়ে বাকি: ${labelOf(final.id, config)}`] : []),
    'দয়া করে দেখে পরামর্শ দিন।',
  ].join('\n')
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`

// The fields of a case the server keeps, as sent in the "case" part of POST /api/cases.
export function uploadFields(record: CaseRecord) {
  const { result, answers } = record.diagnosis
  return {
    sentAt: record.sentAt,
    unionId: record.unionId ?? null,
    decision: result.decision,
    candidates: result.candidates,
    finalId: finalOf(record.diagnosis)?.id ?? null,
    answers,
  }
}

export type UploadOutcome = 'uploaded' | 'signedOut' | 'failed'

export async function uploadCase(record: CaseRecord): Promise<UploadOutcome> {
  const body = new FormData()
  body.set('case', JSON.stringify(uploadFields(record)))
  record.photos.forEach((blob, i) => body.set(i === 0 ? 'top' : 'under', blob, i === 0 ? 'leaf-top.jpg' : 'leaf-under.jpg'))
  try {
    const res = await fetch('/api/cases', { method: 'POST', body })
    if (res.status === 401) return 'signedOut'
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error('Could not upload the case', err)
    return 'failed'
  }
  if (record.id !== undefined) await putCase({ ...record, uploaded: true })
  return 'uploaded'
}

// Uploads the cases that didn't reach the server (sent offline or signed out). Stops at the first
// failure: the rest will wait for the next try.
export async function syncCases(): Promise<void> {
  const pending = (await getCases()).filter((c) => c.uploaded === false)
  for (const record of pending) {
    if ((await uploadCase(record)) !== 'uploaded') return
  }
}

export type ShareOutcome = { via: 'share' | 'whatsapp'; upload: UploadOutcome } | 'cancelled'

export async function shareCase(record: DiagnosisRecord, config: DiagnosisConfig, date: string): Promise<ShareOutcome> {
  const union = clientUnion()
  const text = caseSummary(record, config, date, placeOf(union).name)
  const captures = await Promise.all([getCapture('top'), getCapture('under')])
  const photos = captures.flatMap((c) => (c ? [c.blob] : []))
  const files = photos.map((blob, i) => new File([blob], i === 0 ? 'leaf-top.jpg' : 'leaf-under.jpg', { type: 'image/jpeg' }))

  let via: 'share' | 'whatsapp' = 'whatsapp'
  if (typeof navigator.share === 'function') {
    const withFiles = files.length > 0 && navigator.canShare?.({ files })
    try {
      await navigator.share(withFiles ? { title: SHARE_TITLE, text, files } : { title: SHARE_TITLE, text })
      via = 'share'
    } catch (err) {
      // The farmer closed the share sheet: nothing was sent.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      console.error('Share failed, falling back to WhatsApp', err)
    }
  }
  if (via === 'whatsapp') window.open(whatsappUrl(text), '_blank', 'noopener')

  const saved: CaseRecord = { sentAt: Date.now(), diagnosis: record, photos, via, unionId: union?.id, uploaded: false }
  try {
    saved.id = await saveCase(saved)
  } catch (err) {
    console.error('Could not save the sent case', err)
  }
  return { via, upload: await uploadCase(saved) }
}
