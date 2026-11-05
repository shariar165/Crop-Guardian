// Answers already written, so a question farmers keep asking costs its model calls once. The key is
// the question in a normal form, the crop, and the versions of the advice and the prompts, so a
// change to either starts afresh. Only a hash of the question is stored, never its words.
import { createHash } from 'node:crypto'
import { fromBnDigits } from '@/lib/bn'
import type { CropId } from '@/lib/crops'
import type { AskResult } from './answer'
import { KB } from './kb'
import { PROMPT_VERSION } from './prompts'

export type CachedAnswer = Pick<AskResult, 'answer' | 'sources' | 'escalate' | 'note'>

export type AnswerCache = {
  get: (key: string) => Promise<CachedAnswer | null>
  set: (key: string, value: CachedAnswer) => Promise<void>
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

// Changes when any passage does, so an answer is never served from advice that has since changed.
export const KB_VERSION = sha256(JSON.stringify(KB.map((c) => [c.id, c.title, c.source, c.href, c.text, c.crop, c.disease]))).slice(0, 16)

// Spacing, punctuation, case, digit script and invisible joiners don't change what was asked.
export const normalizeQuestion = (question: string): string =>
  fromBnDigits(question.normalize('NFC'))
    .replace(/[‌‍]/g, '')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const answerKey = (question: string, crop: CropId | null): string => sha256([KB_VERSION, PROMPT_VERSION, crop ?? '', normalizeQuestion(question)].join('\n'))
