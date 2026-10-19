// Questions the farmer can answer by looking at the leaf, to narrow the candidates the photos left.
// Each answer rules out classes (by class id); "জানি না" rules out nothing.
import type { Answer, AnswerRecord } from '@/lib/captureStore'

export type Question = {
  id: string
  text: string
  // What the answer is about, for "আপনার উত্তর: …".
  subject: string
  art: { yes: 'rings' | 'spores'; no: 'plain' | 'noSpores' }
  rulesOut: { yes: string[]; no: string[] }
}

export const QUESTIONS: Question[] = [
  {
    id: 'rings',
    text: 'দাগের ভেতরে কি চাকতির মতো গোল গোল রিং আছে?',
    subject: 'দাগের ভেতরে চাকতির মতো রিং',
    art: { yes: 'rings', no: 'plain' },
    // Rings mean a spot (not healthy) of early blight, not late blight.
    rulesOut: { yes: ['late_blight', 'healthy'], no: ['early_blight'] },
  },
  {
    id: 'spores',
    text: 'পাতা উল্টে দেখুন: নিচে কি সাদা তুলার মতো কিছু আছে?',
    subject: 'পাতার নিচে সাদা তুলার মতো কিছু',
    art: { yes: 'spores', no: 'noSpores' },
    // White growth underneath is late blight's; without it, it isn't late blight.
    rulesOut: { yes: ['early_blight', 'healthy'], no: ['late_blight'] },
  },
]

const after = (candidates: string[], q: Question, answer: Answer) =>
  answer === 'unsure' ? candidates : candidates.filter((id) => !q.rulesOut[answer].includes(id))

// The candidates left after the answers, in their original order.
export function remainingAfter(candidates: string[], answers: AnswerRecord[]): string[] {
  return answers.reduce((left, a) => {
    const q = QUESTIONS.find((q) => q.id === a.question)
    return q ? after(left, q, a.answer) : left
  }, candidates)
}

// Worth asking only if either answer leaves something, and at least one answer removes something.
export function splits(q: Question, candidates: string[]): boolean {
  const [yes, no] = [after(candidates, q, 'yes'), after(candidates, q, 'no')]
  return yes.length > 0 && no.length > 0 && (yes.length < candidates.length || no.length < candidates.length)
}

export function nextQuestion(candidates: string[], answers: AnswerRecord[]): Question | null {
  const left = remainingAfter(candidates, answers)
  if (left.length <= 1) return null
  return QUESTIONS.find((q) => !answers.some((a) => a.question === q.id) && splits(q, left)) ?? null
}

// How many questions this run will ask at most, given what is left now.
export function questionCount(candidates: string[], answers: AnswerRecord[]): number {
  const left = remainingAfter(candidates, answers)
  const open = left.length > 1 ? QUESTIONS.filter((q) => !answers.some((a) => a.question === q.id) && splits(q, left)) : []
  return answers.length + open.length
}

const ANSWER_TAIL: Record<Answer, string> = { yes: 'আছে', no: 'নেই', unsure: 'আছে কি না জানা নেই' }

export function answerLine({ question, answer }: AnswerRecord): string | null {
  const q = QUESTIONS.find((q) => q.id === question)
  return q ? `আপনার উত্তর: ${q.subject} ${ANSWER_TAIL[answer]}` : null
}
