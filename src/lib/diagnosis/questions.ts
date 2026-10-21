// Questions the farmer can answer by looking at the leaf, to narrow the candidates the photos left.
// Each answer rules out classes (by class id); "জানি না" rules out nothing. Each crop has its own,
// with ids unique across crops, since answers are stored by question id.
import type { Answer, AnswerRecord } from '@/lib/captureStore'
import type { CropId } from '@/lib/crops'

export type AnswerArtKind =
  | 'rings' | 'plain' | 'spores' | 'noSpores'
  | 'riceSpots' | 'riceClean' | 'riceEye' | 'riceRound' | 'riceTipDry' | 'riceStunted' | 'riceTall' | 'riceSheath' | 'riceSheathClean'

export type Question = {
  id: string
  text: string
  // What the answer is about, for "আপনার উত্তর: …".
  subject: string
  art: { yes: AnswerArtKind; no: AnswerArtKind }
  rulesOut: { yes: string[]; no: string[] }
  // The class whose hallmark the question asks about: asked only while that class is a candidate,
  // so a "yes" never points to a disease the question wasn't about.
  about?: string
}

const POTATO: Question[] = [
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

// Each asks for one disease's hallmark (Rice Doctor fact sheets, BRRI). "No" rules that disease out;
// "yes" rules out only what can't show it. To review with BRRI or an agronomist.
const PADDY: Question[] = [
  {
    id: 'rice_symptom',
    text: 'পাতায় বা খোলে কি কোনো দাগ, হলুদ ভাব বা শুকানো অংশ আছে?',
    subject: 'পাতায় বা খোলে দাগ, হলুদ ভাব বা শুকানো অংশ',
    art: { yes: 'riceSpots', no: 'riceClean' },
    rulesOut: { yes: ['healthy'], no: ['blast', 'brown_spot', 'bacterial_leaf_blight', 'tungro', 'sheath_blight'] },
    about: 'healthy',
  },
  {
    id: 'rice_eye',
    text: 'দাগগুলো কি চোখের মতো লম্বাটে, দুই মাথা সরু, মাঝখানটা ছাই রঙের?',
    subject: 'চোখের মতো লম্বাটে, মাঝে ছাই রঙের দাগ',
    art: { yes: 'riceEye', no: 'riceRound' },
    // Brown spot's are round or oval; BLB and tungro discolour the leaf rather than spot it.
    rulesOut: { yes: ['healthy', 'brown_spot', 'bacterial_leaf_blight', 'tungro'], no: ['blast'] },
    about: 'blast',
  },
  {
    id: 'rice_tip',
    text: 'পাতা কি আগা থেকে কিনারা ধরে হলুদ-সাদাটে হয়ে খড়ের মতো শুকাচ্ছে?',
    subject: 'আগা থেকে কিনারা ধরে খড়ের মতো শুকানো',
    art: { yes: 'riceTipDry', no: 'riceClean' },
    rulesOut: { yes: ['healthy'], no: ['bacterial_leaf_blight'] },
    about: 'bacterial_leaf_blight',
  },
  {
    id: 'rice_stunt',
    text: 'গাছ কি খাটো হয়ে গেছে, কুশি কম, আর পাতা কমলা-হলুদ?',
    subject: 'খাটো গাছ, কম কুশি, কমলা-হলুদ পাতা',
    art: { yes: 'riceStunted', no: 'riceTall' },
    // Spot diseases don't stunt the plant or turn it orange.
    rulesOut: { yes: ['healthy', 'blast', 'brown_spot', 'sheath_blight'], no: ['tungro'] },
    about: 'tungro',
  },
  {
    id: 'rice_sheath',
    text: 'গাছের গোড়ায়, পানির ঠিক ওপরে খোলে কি ধূসর-সবুজ ছোপ ছোপ দাগ আছে?',
    subject: 'গোড়ার খোলে পানির ওপরে ধূসর-সবুজ ছোপ',
    art: { yes: 'riceSheath', no: 'riceSheathClean' },
    rulesOut: { yes: ['healthy', 'tungro'], no: ['sheath_blight'] },
    about: 'sheath_blight',
  },
]

export const QUESTIONS: Record<CropId, Question[]> = { potato: POTATO, paddy: PADDY }

const after = (candidates: string[], q: Question, answer: Answer) =>
  answer === 'unsure' ? candidates : candidates.filter((id) => !q.rulesOut[answer].includes(id))

// The candidates left after the answers, in their original order.
export function remainingAfter(candidates: string[], answers: AnswerRecord[], crop: CropId): string[] {
  return answers.reduce((left, a) => {
    const q = QUESTIONS[crop].find((q) => q.id === a.question)
    return q ? after(left, q, a.answer) : left
  }, candidates)
}

// Worth asking only about a class still in the running, if either answer leaves something, and at
// least one answer removes something.
export function splits(q: Question, candidates: string[]): boolean {
  if (q.about && !candidates.includes(q.about)) return false
  const [yes, no] = [after(candidates, q, 'yes'), after(candidates, q, 'no')]
  return yes.length > 0 && no.length > 0 && (yes.length < candidates.length || no.length < candidates.length)
}

export function nextQuestion(candidates: string[], answers: AnswerRecord[], crop: CropId): Question | null {
  const left = remainingAfter(candidates, answers, crop)
  if (left.length <= 1) return null
  return QUESTIONS[crop].find((q) => !answers.some((a) => a.question === q.id) && splits(q, left)) ?? null
}

// How many questions this run will ask at most, given what is left now.
export function questionCount(candidates: string[], answers: AnswerRecord[], crop: CropId): number {
  const left = remainingAfter(candidates, answers, crop)
  const open = left.length > 1 ? QUESTIONS[crop].filter((q) => !answers.some((a) => a.question === q.id) && splits(q, left)) : []
  return answers.length + open.length
}

const ANSWER_TAIL: Record<Answer, string> = { yes: 'আছে', no: 'নেই', unsure: 'আছে কি না জানা নেই' }

export function answerLine({ question, answer }: AnswerRecord, crop: CropId): string | null {
  const q = QUESTIONS[crop].find((q) => q.id === question)
  return q ? `আপনার উত্তর: ${q.subject} ${ANSWER_TAIL[answer]}` : null
}
