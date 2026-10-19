// Which screen a diagnosis belongs on, and its final answer once the farmer has answered questions.
import type { Answer, AnswerRecord, DiagnosisRecord } from '@/lib/captureStore'
import type { Decision } from './decide'
import type { Mock } from './mock'
import { QUESTIONS, remainingAfter } from './questions'

export const RESULT_PATH: Record<Decision, string> = {
  confident: '/result',
  uncertain: '/result/uncertain',
  unknown: '/unknown',
}

export type Final = { id: string; via: 'model' | 'questions' }

// The one class left: from the model, or from the farmer's answers when the photos were uncertain.
export function finalOf({ result, answers }: DiagnosisRecord): Final | null {
  if (result.decision === 'confident') return { id: result.candidates[0], via: 'model' }
  if (result.decision !== 'uncertain') return null
  const left = remainingAfter(result.candidates, answers)
  return left.length === 1 ? { id: left[0], via: 'questions' } : null
}

export function belongsOn(path: string, record: DiagnosisRecord): boolean {
  const decision = record.result.decision
  if (path === '/result') return finalOf(record) !== null
  if (path === '/questions' || path === '/result/uncertain') return decision === 'uncertain'
  return path === RESULT_PATH[decision]
}

export const screenFor = (record: DiagnosisRecord) => (finalOf(record) ? '/result' : RESULT_PATH[record.result.decision])

// Demo answers travel in the URL (`a=rings.yes,spores.no`), so demos never touch the device's data.
const ANSWERS: Answer[] = ['yes', 'no', 'unsure']

export function parseAnswers(value: string | string[] | undefined): AnswerRecord[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',').flatMap((pair) => {
    const [question, answer] = pair.split('.')
    return QUESTIONS.some((q) => q.id === question) && ANSWERS.includes(answer as Answer)
      ? [{ question, answer: answer as Answer }]
      : []
  })
}

export function withMock(path: string, mock: Mock | undefined, answers: AnswerRecord[] = []): string {
  if (!mock) return path
  const a = answers.length ? `&a=${answers.map((x) => `${x.question}.${x.answer}`).join(',')}` : ''
  return `${path}?mock=${mock}${a}`
}
