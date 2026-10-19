// Sends a case to the agriculture officer through the phone's own share sheet (photos + a short
// Bengali summary), or a WhatsApp text link where sharing isn't available. Sent cases are kept on
// the device for the ledger.
import { bnDate } from '@/lib/bn'
import { type DiagnosisRecord, getCapture, saveCase } from '@/lib/captureStore'
import type { DiagnosisConfig } from '@/lib/diagnosis/config'
import { CONFIDENCE_WORD, labelOf, orList, photoLine } from '@/lib/diagnosis/explain'
import { finalOf } from '@/lib/diagnosis/flow'
import { answerLine } from '@/lib/diagnosis/questions'
import { DEFAULT_LOCATION } from '@/lib/weather'

export const SHARE_TITLE = 'Crop Guardian — আলুর পাতা'

export function caseSummary(record: DiagnosisRecord, config: DiagnosisConfig, date: string): string {
  const { result } = record
  const final = finalOf(record)
  const verdict =
    result.decision === 'confident'
      ? `${CONFIDENCE_WORD.confident} — ${labelOf(result.candidates[0], config)}`
      : result.decision === 'uncertain'
        ? `${CONFIDENCE_WORD.uncertain} — ${orList(result.candidates, config)}`
        : CONFIDENCE_WORD.unknown
  return [
    `${SHARE_TITLE} (পরীক্ষামূলক অ্যাপ)`,
    `তারিখ: ${bnDate(date)}`,
    `এলাকা: ${DEFAULT_LOCATION.name}`,
    `অ্যাপের ফল: ${verdict}`,
    photoLine(result, config),
    ...record.answers.flatMap((a) => answerLine(a) ?? []),
    ...(final?.via === 'questions' ? [`উত্তর মিলিয়ে বাকি: ${labelOf(final.id, config)}`] : []),
    'দয়া করে দেখে পরামর্শ দিন।',
  ].join('\n')
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`

export type ShareOutcome = 'share' | 'whatsapp' | 'cancelled'

export async function shareCase(record: DiagnosisRecord, text: string, { demo = false } = {}): Promise<ShareOutcome> {
  const captures = demo ? [] : await Promise.all([getCapture('top'), getCapture('under')])
  const photos = captures.flatMap((c) => (c ? [c.blob] : []))
  const files = photos.map((blob, i) => new File([blob], i === 0 ? 'leaf-top.jpg' : 'leaf-under.jpg', { type: 'image/jpeg' }))

  let via: ShareOutcome = 'whatsapp'
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

  if (!demo) {
    await saveCase({ sentAt: Date.now(), diagnosis: record, photos, via }).catch((err) =>
      console.error('Could not save the sent case', err),
    )
  }
  return via
}
