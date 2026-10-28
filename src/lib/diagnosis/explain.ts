// The words on the result screens, from real inputs only: the model's decisions, today's weather risk,
// and the farmer's answers.
import type { CropId } from '@/lib/crops'
import { DAY_STATE, type Risk } from '@/lib/data'
import type { CombinedResult } from './combine'
import type { DiagnosisConfig } from './config'
import { PHOTO_SPECS } from './crops'
import type { PhotoResult } from './decide'

export const CONFIDENCE_WORD = { confident: 'নিশ্চিত', uncertain: 'নিশ্চিত নই', unknown: 'চিনতে পারিনি' } as const

type Labels = Pick<DiagnosisConfig, 'labelsBn'>

export const labelOf = (id: string, config: Labels) => config.labelsBn[id] ?? id

// "নাবি ধসা বা আগাম ধসা"
export const orList = (ids: string[], config: Labels) => ids.map((id) => labelOf(id, config)).join(' বা ')

function photoWord(photo: PhotoResult, config: DiagnosisConfig): string {
  if (photo.decision === 'unknown') return CONFIDENCE_WORD.unknown
  if (photo.decision === 'uncertain') return `${orList(photo.candidates, config)} (${CONFIDENCE_WORD.uncertain})`
  return `${labelOf(photo.candidates[0], config)} (${CONFIDENCE_WORD.confident})`
}

// What each photo showed, e.g. "দুই ছবিতেই একই ফল: নাবি ধসা (নিশ্চিত)".
export function photoLine(result: CombinedResult, config: DiagnosisConfig, crop: CropId): string {
  const { top, under } = result.photos
  const [a, b] = [photoWord(top, config), photoWord(under, config)]
  const names = PHOTO_SPECS[crop].photos
  return a === b ? `দুই ছবিতেই একই ফল: ${a}` : `${names.top.name}: ${a} · ${names.under.name}: ${b}`
}

export type TodayRisk = { today: Risk; reason: string } | 'unavailable'

export function riskLine(risk: TodayRisk, crop: CropId): string {
  if (risk === 'unavailable') return 'আজকের আবহাওয়ার তথ্য পাওয়া যায়নি (নেট নেই)'
  return `আজ এলাকায় ${PHOTO_SPECS[crop].riskLabel}: ${DAY_STATE[risk.today].word}। ${risk.reason}`
}

// The classes this model can recognise, for the "can't identify" screen.
export const knownList = (config: DiagnosisConfig) => config.diseases.map((id) => labelOf(id, config)).join(', ')
