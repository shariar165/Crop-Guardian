// «কৃষি সহায়ক»: answers a farmer's question from the app's own advice (src/lib/assistant/kb.ts).
//   1. A question already answered comes from the cache, for no model call at all.
//   2. The small model reads the question: greeting, off topic, or a question, and what to search.
//   3. searchKb finds the chunks (hybrid search + rerank). The crop comes from the farmer's words or
//      field; with neither, and advice that differs by crop, the farmer is asked which.
//   4. The answer model writes from those chunks and the forecast, in one call, and returns a
//      structured answer with the ids of the chunks it used. A question about the risk rule skips
//      this step: the rule is quoted, because models left its numbers out.
//   5. guard.ts drops doses and invented sources before anything reaches the farmer. An answer
//      with no source, another script or a number its sources don't have goes to the next model.
//      With no model left, the farmer reads the closest passage itself.
// No server-only import: scripts/eval-assistant.ts runs the same code with its own database client.
import { generateText, type LanguageModelUsage, type ModelMessage, NoObjectGeneratedError, Output } from 'ai'
import { z } from 'zod'
import { type CropId } from '@/lib/crops'
import { bnDate } from '@/lib/bn'
import { DAY_STATE, type Risk } from '@/lib/data'
import { RISK_RULE } from '@/lib/guide'
import { answerKey, type AnswerCache, type CachedAnswer } from './cache'
import { aboutMedicine, answerProblem, ASK_CROP, BRAND_REFERRAL, EXPERIMENTAL_NOTE, HISTORY_TURNS, looksLikeQuestion, MAX_HISTORY_ANSWER, MAX_QUESTION, neverOffTopic, NO_SOURCE, OUT_OF_SCOPE, PASSAGE_INTRO, redactPhones, sanitizeAnswer, validSources } from './guard'
import { chunkById, type KbChunk, type KbPassage, namedCrops, questionScope, RULE_CHUNK } from './kb'
import { withFallback } from './models'
import { ANSWER_INSTRUCTIONS, answerPrompt, PROMPT_VERSION, REWRITE_INSTRUCTIONS } from './prompts'
import { type Query, searchKb } from './retrieve'

export const GREETING = 'নমস্কার, আসসালামু আলাইকুম! আলুর নাবি ধসা, আলু চাষ, ধানের ব্লাস্ট বা এই অ্যাপ নিয়ে যা জানতে চান, লিখুন।'

// Models tried again after a bad answer. Fewer than the chain, and few, so a question the sources
// really can't answer doesn't wait on every model before the farmer hears so.
const MAX_REJECTED = 2

export type Turn = { q: string; a: string }

export type TodayRisk = { place: string; today: Risk; reason: string; days: { date: string; risk: Risk }[] }

export type AskDeps = {
  query: Query
  risk: (crop: CropId) => Promise<TodayRisk>
  // Optional: the eval leaves it out, because a cached answer tests nothing.
  cache?: AnswerCache
}

export type AskSource = Pick<KbChunk, 'id' | 'title' | 'source' | 'href'>

export type Tokens = { in: number; cached: number; out: number }

export type AskResult = {
  answer: string
  sources: AskSource[]
  escalate: boolean
  kind: 'greeting' | 'off_topic' | 'question'
  // The answer is ASK_CROP: the screen offers the two crops as buttons.
  askCrop: boolean
  // Shown under every model-written answer.
  note: string | null
  // For the eval script and the server log; never shown.
  meta: {
    promptVersion: string
    redacted: boolean
    // The guard replaced the answer because it named a medicine brand.
    named: boolean
    // Why answers were refused before this one, or why none was accepted.
    rejected: string[]
    shown: string[]
    toolCalls: string[]
    // Which model read the question, and which wrote the answer; null when none did.
    readBy: string | null
    writtenBy: string | null
    // What each step spent, counting refused answers and broken JSON, which cost the same.
    tokens: { rewrite: Tokens; answer: Tokens }
    cached: boolean
    // No answer passed: the farmer got the closest passage, or the officer referral.
    fallback: 'passage' | 'referral' | null
  }
}

const rewriteSchema = z.object({
  kind: z.enum(['greeting', 'off_topic', 'question']),
  queries: z.array(z.string()).max(3).describe('Short Bengali search phrases with root words'),
  crop: z.enum(['potato', 'paddy']).nullable(),
  disease: z.string().nullable().describe('The one disease named, or null'),
  wantsRisk: z.boolean(),
  wantsRule: z.boolean(),
})

// With no model able to read the question, it is searched as the farmer wrote it.
const UNREAD: z.infer<typeof rewriteSchema> = { kind: 'question', queries: [], crop: null, disease: null, wantsRisk: false, wantsRule: false }

const answerSchema = z.object({
  answer: z.string().describe('The Bengali answer, at most four sentences'),
  sources: z.array(z.string()).describe('Ids of the <source> blocks actually used'),
  escalate: z.boolean().describe('True when the farmer should contact the officer or send a leaf photo'),
})

// Only the last few turns go back to the model, each cut to the same limit as a new question and
// the answers shorter still: they are context for the next question, and every step pays for them.
export function historyMessages(history: unknown): ModelMessage[] {
  if (!Array.isArray(history)) return []
  return history
    .filter((t): t is Turn => typeof t?.q === 'string' && typeof t?.a === 'string')
    .slice(-HISTORY_TURNS)
    .flatMap((t) => [
      { role: 'user' as const, content: redactPhones(t.q.slice(0, MAX_QUESTION)) },
      { role: 'assistant' as const, content: t.a.slice(0, MAX_HISTORY_ANSWER) },
    ])
}

const noTokens = (): Tokens => ({ in: 0, cached: 0, out: 0 })

// Adds a call's usage, including a reply that failed to parse: the provider charged for that too.
async function counted<T extends { usage: LanguageModelUsage }>(into: Tokens, call: () => Promise<T>): Promise<T> {
  const add = (u: LanguageModelUsage | undefined) => {
    into.in += u?.inputTokens ?? 0
    into.cached += u?.inputTokenDetails?.cacheReadTokens ?? 0
    into.out += u?.outputTokens ?? 0
  }
  try {
    const result = await call()
    add(result.usage)
    return result
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) add(err.usage)
    throw err
  }
}

const fixed = (kind: AskResult['kind'], answer: string, meta: Partial<AskResult['meta']> = {}): AskResult => ({
  answer,
  sources: [],
  escalate: false,
  kind,
  askCrop: false,
  note: null,
  meta: { promptVersion: PROMPT_VERSION, redacted: false, named: false, rejected: [], shown: [], toolCalls: [], readBy: null, writtenBy: null, tokens: { rewrite: noTokens(), answer: noTokens() }, cached: false, fallback: null, ...meta },
})

const sourceOf = ({ id, title, source, href }: AskSource): AskSource => ({ id, title, source, href })

const cropOf = (c: KbPassage | undefined) => (c ? (chunkById(c.id)?.crop ?? null) : null)

// The cache must never cost a farmer an answer: without its table the app works as if it were empty.
const cacheFailed = (err: unknown) => {
  console.error('Assistant cache failed, carrying on without it:', err)
  return null
}

export async function ask(
  { question, history = [], today, field = null }: { question: string; history?: unknown; today: string; field?: CropId | null },
  deps: AskDeps,
): Promise<AskResult> {
  const past = historyMessages(history)

  // A follow-up means something else after each conversation, so only a first question is cached.
  const key = past.length === 0 ? answerKey(question, questionScope(question, {}, field).crop) : null
  const hit = key ? await deps.cache?.get(key).catch(cacheFailed) : null
  if (hit) {
    // Read through the guard again: its lists can grow after an answer was stored.
    const { text } = sanitizeAnswer(hit.answer)
    return { ...fixed('question', text, { cached: true }), sources: hit.sources, escalate: hit.escalate, note: hit.note }
  }
  const remember = async (r: AskResult) => {
    const value: CachedAnswer = { answer: r.answer, sources: r.sources, escalate: r.escalate, note: r.note }
    if (key) await deps.cache?.set(key, value).catch(cacheFailed)
    return r
  }

  const tokens = { rewrite: noTokens(), answer: noTokens() }

  // The instructions come first and never change, so the providers' prompt caches can reuse them.
  const reading = await withFallback('rewrite', (model, abortSignal, providerOptions) =>
    counted(tokens.rewrite, () =>
      generateText({
        model,
        instructions: REWRITE_INSTRUCTIONS,
        messages: [...past, { role: 'user', content: question }],
        output: Output.object({ schema: rewriteSchema }),
        maxRetries: 0,
        abortSignal,
        providerOptions,
      }),
    ),
  ).catch((err: unknown) => {
    console.error('Assistant could not read the question, searching it as written:', err)
    return null
  })
  const plan = reading?.result.output ?? UNREAD
  const readBy = reading?.modelUsed ?? null
  const spent = { readBy, tokens }

  if (plan.kind === 'greeting' && !looksLikeQuestion(question)) return fixed('greeting', GREETING, spent)
  const mustAnswer = neverOffTopic(question)
  if (plan.kind === 'off_topic' && !mustAnswer) return fixed('off_topic', OUT_OF_SCOPE, spent)

  // Only a follow-up leaves the crop to the model, which alone has read the earlier turns. On a first
  // question its guess is how a question about the app's colours got paddy's answer.
  const scope = questionScope(question, { ...plan, crop: past.length > 0 ? plan.crop : null }, field)

  if (plan.wantsRule && scope.crop) {
    const chunk = chunkById(RULE_CHUNK[scope.crop])!
    return remember({ ...fixed('question', RISK_RULE[scope.crop], { ...spent, shown: [chunk.id] }), sources: [sourceOf(chunk)], note: EXPERIMENTAL_NOTE })
  }

  const found = await searchKb(deps.query, question, plan.queries, scope)

  // Neither the words nor a field say which crop, and the closest advice is one crop's: answering
  // would guess. Advice for every crop (SMS, offline use) needs no such question.
  const cropOpen = !scope.crop && namedCrops(question).length === 0
  if (cropOpen && (plan.wantsRisk || plan.wantsRule || cropOf(found[0]))) {
    return { ...fixed('question', ASK_CROP, { ...spent, shown: found.map((c) => c.id) }), askCrop: true }
  }
  const chunks = cropOpen ? found.filter((c) => !cropOf(c)) : found
  const shown = new Map<string, KbPassage>(chunks.map((c) => [c.id, c]))

  const riskCrops = plan.wantsRisk ? (scope.crop ? [scope.crop] : namedCrops(question)) : []
  const forecast = (
    await Promise.all(
      riskCrops.map((crop) =>
        deps
          .risk(crop)
          .then((r) => {
            const word = (risk: Risk) => DAY_STATE[risk].word
            // Dates in the app's own Bengali form, so the model copies those and not ISO digits.
            return JSON.stringify({ place: r.place, date: bnDate(today), today: word(r.today), reason: r.reason, days: r.days.map((d) => `${bnDate(d.date)}: ${word(d.risk)}`) })
          })
          .catch((err: unknown) => {
            console.error('Assistant could not get the forecast:', err)
            return null
          }),
      ),
    )
  ).flatMap((f) => f ?? [])

  const rejected: string[] = []
  const toolCalls = forecast.length > 0 ? ['todayRisk'] : []
  const medicine = aboutMedicine(question)

  // No answer passed. The closest passage is the app's own text, so it can't be wrong in itself, but
  // it may not be what was asked: hence the words before it. The farmer is never left with an error.
  // Models that read the passages and cited none found nothing there, and medicine is the officer's.
  const giveUp = (problems: string[]): AskResult => {
    const meta = { ...spent, rejected: problems, shown: [...shown.keys()], toolCalls }
    const top = chunks[0]
    const nothingThere = problems.length > 0 && problems.every((p) => p === 'no_source')
    if (top && !medicine && !nothingThere) {
      const { text } = sanitizeAnswer(`${PASSAGE_INTRO} «${top.title}»: ${top.text}`)
      return { ...fixed('question', text, { ...meta, fallback: 'passage' }), sources: [sourceOf(top)], escalate: true, note: EXPERIMENTAL_NOTE }
    }
    return { ...fixed('question', medicine ? BRAND_REFERRAL : NO_SOURCE, { ...meta, fallback: 'referral' }), escalate: true }
  }

  if (chunks.length === 0 && forecast.length === 0) return giveUp([])

  const problemWith = (out: z.infer<typeof answerSchema>) => {
    if (out.answer.trim() === OUT_OF_SCOPE) return mustAnswer ? 'no_source' : null
    const cited = validSources(out.sources, [...shown.keys()]).map((id) => shown.get(id)!)
    if (cited.length === 0 && forecast.length === 0) return 'no_source'
    return answerProblem(out.answer, [...cited.map((c) => `${c.title} ${c.text}`), ...forecast].join(' '))
  }

  // A failed model isn't retried on itself: the next one in the chain is tried instead. A bad answer
  // counts as failing, up to MAX_REJECTED times.
  const written = await withFallback('answer', async (model, abortSignal, providerOptions) => {
    const attempt = await counted(tokens.answer, () =>
      generateText({
        model,
        instructions: ANSWER_INSTRUCTIONS,
        messages: [...past, { role: 'user', content: answerPrompt({ question, chunks, forecast }) }],
        output: Output.object({ schema: answerSchema }),
        maxOutputTokens: 800,
        maxRetries: 0,
        abortSignal,
        providerOptions,
      }),
    )
    const problem = rejected.length < MAX_REJECTED ? problemWith(attempt.output) : null
    if (problem) {
      rejected.push(problem)
      throw new Error(`answer rejected: ${problem}`)
    }
    return attempt
  }).catch((err: unknown) => {
    console.error('Assistant: no model gave an answer:', err)
    return null
  })
  if (!written) return giveUp(rejected)
  const { result, modelUsed: writtenBy } = written

  const meta = { ...spent, writtenBy, rejected, shown: [...shown.keys()], toolCalls }

  const out = result.output
  if (out.answer.trim() === OUT_OF_SCOPE && !mustAnswer) return fixed('off_topic', OUT_OF_SCOPE, meta)

  // The last model allowed gets no further chance: what it wrote is checked, never shown unchecked.
  const problem = problemWith(out)
  if (problem) return giveUp([...rejected, problem])

  const sourceIds = validSources(out.sources, [...shown.keys()])
  const { text, redacted, named } = sanitizeAnswer(out.answer)
  const answer: AskResult = {
    ...fixed('question', text, { ...meta, redacted, named }),
    sources: sourceIds.map((id) => sourceOf(shown.get(id)!)),
    escalate: out.escalate,
    note: EXPERIMENTAL_NOTE,
  }
  // Tomorrow's forecast is different, so an answer quoting today's is never kept.
  return forecast.length > 0 || sourceIds.length === 0 ? answer : remember(answer)
}
