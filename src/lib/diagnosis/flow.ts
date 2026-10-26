// Which screen a diagnosis belongs on, and its final answer once the farmer has answered questions.
import type { DiagnosisRecord } from '@/lib/captureStore'
import { cropOfRecord } from './crops'
import type { Decision } from './decide'
import { remainingAfter } from './questions'

export const RESULT_PATH: Record<Decision, string> = {
  confident: '/result',
  uncertain: '/result/uncertain',
  unknown: '/unknown',
}

export type Final = { id: string; via: 'model' | 'questions' }

// The one class left: from the model, or from the farmer's answers when the photos were uncertain.
export function finalOf(record: DiagnosisRecord): Final | null {
  const { result, answers } = record
  if (result.decision === 'confident') return { id: result.candidates[0], via: 'model' }
  if (result.decision !== 'uncertain') return null
  const left = remainingAfter(result.candidates, answers, cropOfRecord(record))
  return left.length === 1 ? { id: left[0], via: 'questions' } : null
}

export function belongsOn(path: string, record: DiagnosisRecord): boolean {
  const decision = record.result.decision
  if (path === '/result') return finalOf(record) !== null
  if (path === '/questions' || path === '/result/uncertain') return decision === 'uncertain'
  return path === RESULT_PATH[decision]
}

export const screenFor = (record: DiagnosisRecord) => (finalOf(record) ? '/result' : RESULT_PATH[record.result.decision])
