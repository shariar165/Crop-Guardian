// «কৃষি সহায়ক»: answers a farmer's question from the app's own advice (src/lib/assistant/kb.ts).
//   1. The small model reads the question: greeting, off topic, or a question, and what to search.
//   2. searchKb finds the chunks (hybrid search + rerank).
//   3. The answer model writes from those chunks. It may search again or ask for today's risk
//      through tools, and returns a structured answer with the ids of the chunks it used.
//   4. guard.ts drops doses and invented sources before anything reaches the farmer. An answer
//      with no source, another script or a number its sources don't have goes to the next model.
// No server-only import: scripts/eval-assistant.ts runs the same code with its own database client.
import { generateText, isStepCount, type ModelMessage, Output, tool } from 'ai'
import { z } from 'zod'
import { type CropId } from '@/lib/crops'
import { bnDate } from '@/lib/bn'
import { DAY_STATE, type Risk } from '@/lib/data'
import { aboutMedicine, answerProblem, BRAND_REFERRAL, EXPERIMENTAL_NOTE, HISTORY_TURNS, looksLikeQuestion, MAX_ANSWER, MAX_QUESTION, neverOffTopic, NO_SOURCE, OUT_OF_SCOPE, redactPhones, sanitizeAnswer, validSources } from './guard'
import { type KbChunk, type KbPassage, questionScope } from './kb'
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
}

export type AskSource = Pick<KbChunk, 'id' | 'title' | 'source' | 'href'>

export type AskResult = {
  answer: string
  sources: AskSource[]
  escalate: boolean
  kind: 'greeting' | 'off_topic' | 'question'
  // Shown under every model-written answer.
  note: string | null
  // For the eval script and the server log; never shown.
  meta: {
    promptVersion: string
    redacted: boolean
    // The guard replaced the answer because it named a medicine brand.
    named: boolean
    // Why answers were refused before this one, or why this one fell back to NO_SOURCE.
    rejected: string[]
    shown: string[]
    toolCalls: string[]
    // Which model in each fallback chain answered.
    models: string[]
    inputTokens: number
    cachedInputTokens: number
    outputTokens: number
  }
}

const rewriteSchema = z.object({
  kind: z.enum(['greeting', 'off_topic', 'question']),
  queries: z.array(z.string()).max(3).describe('Short Bengali search phrases with root words'),
  crop: z.enum(['potato', 'paddy']).nullable(),
  disease: z.string().nullable().describe('The one disease named, or null'),
  wantsRisk: z.boolean(),
})

const answerSchema = z.object({
  answer: z.string().describe('The Bengali answer, at most four sentences'),
  sources: z.array(z.string()).describe('Ids of the <source> blocks actually used'),
  escalate: z.boolean().describe('True when the farmer should contact the officer or send a leaf photo'),
})

// Only the last few turns go back to the model, each cut to the same limits as a new question.
export function historyMessages(history: unknown): ModelMessage[] {
  if (!Array.isArray(history)) return []
  return history
    .filter((t): t is Turn => typeof t?.q === 'string' && typeof t?.a === 'string')
    .slice(-HISTORY_TURNS)
    .flatMap((t) => [
      { role: 'user' as const, content: redactPhones(t.q.slice(0, MAX_QUESTION)) },
      { role: 'assistant' as const, content: t.a.slice(0, MAX_ANSWER) },
    ])
}

const fixed = (kind: AskResult['kind'], answer: string): AskResult => ({
  answer,
  sources: [],
  escalate: false,
  kind,
  note: null,
  meta: { promptVersion: PROMPT_VERSION, redacted: false, named: false, rejected: [], shown: [], toolCalls: [], models: [], inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
})

export async function ask(
  { question, history = [], place, today }: { question: string; history?: unknown; place: string; today: string },
  deps: AskDeps,
): Promise<AskResult> {
  const past = historyMessages(history)

  // The instructions come first and never change, so the providers' prompt caches can reuse them.
  const { result: read, modelUsed: readBy } = await withFallback('rewrite', (model, abortSignal) =>
    generateText({
      model,
      instructions: REWRITE_INSTRUCTIONS,
      messages: [...past, { role: 'user', content: question }],
      output: Output.object({ schema: rewriteSchema }),
      maxRetries: 0,
      abortSignal,
    }),
  )
  const plan = read.output
  const early = (kind: 'greeting' | 'off_topic', text: string) => {
    const r = fixed(kind, text)
    return { ...r, meta: { ...r.meta, models: [readBy] } }
  }
  if (plan.kind === 'greeting' && !looksLikeQuestion(question)) return early('greeting', GREETING)
  const mustAnswer = neverOffTopic(question)
  if (plan.kind === 'off_topic' && !mustAnswer) return early('off_topic', OUT_OF_SCOPE)

  const scope = questionScope(question, plan)
  const chunks = await searchKb(deps.query, question, plan.queries, scope)
  // Every chunk the model is shown, from the first search or its own; it may cite only these.
  const shown = new Map<string, KbPassage>(chunks.map((c) => [c.id, c]))
  // What the forecast tool returned, which an answer may quote just as it quotes a passage.
  const forecast: string[] = []
  const rejected: string[] = []

  const tools = {
    searchGuide: tool({
      description: "Search the app's advice again with a different Bengali phrase.",
      inputSchema: z.object({ phrase: z.string().describe('A short Bengali search phrase with root words') }),
      execute: async ({ phrase }) => {
        const found = await searchKb(deps.query, phrase, [], scope)
        for (const c of found) shown.set(c.id, c)
        return found.map((c) => ({ id: c.id, title: c.title, from: c.source, text: c.text }))
      },
    }),
    todayRisk: tool({
      description: "Today's and the next days' disease risk at the farmer's place, from the weather forecast.",
      inputSchema: z.object({ crop: z.enum(['potato', 'paddy']) }),
      execute: async ({ crop }) => {
        const r = await deps.risk(crop)
        const word = (risk: Risk) => DAY_STATE[risk].word
        // Dates in the app's own Bengali form, so the model copies those and not ISO digits.
        const facts = { place: r.place, today: word(r.today), reason: r.reason, days: r.days.map((d) => `${bnDate(d.date)}: ${word(d.risk)}`) }
        forecast.push(JSON.stringify(facts))
        return facts
      },
    }),
  }

  const problemWith = (out: z.infer<typeof answerSchema>, usedForecast: boolean) => {
    if (out.answer.trim() === OUT_OF_SCOPE) return mustAnswer ? 'no_source' : null
    const cited = validSources(out.sources, [...shown.keys()]).map((id) => shown.get(id)!)
    if (cited.length === 0 && !usedForecast) return 'no_source'
    return answerProblem(out.answer, [...cited.map((c) => `${c.title} ${c.text}`), ...forecast].join(' '))
  }
  const calledRisk = (r: { steps: { toolCalls: { toolName: string }[] }[] }) => r.steps.some((s) => s.toolCalls.some((c) => c.toolName === 'todayRisk'))

  // No answer passed: the farmer is sent to the officer, never shown what failed, never left with an error.
  const giveUp = (problems: string[], meta: Partial<AskResult['meta']>): AskResult => {
    const r = fixed('question', aboutMedicine(question) ? BRAND_REFERRAL : NO_SOURCE)
    return { ...r, escalate: true, meta: { ...r.meta, ...meta, rejected: problems, shown: [...shown.keys()] } }
  }

  // A failed model isn't retried on itself: the next one in the chain is tried instead. A bad answer
  // counts as failing, up to MAX_REJECTED times.
  const writeAnswer = () => withFallback('answer', async (model, abortSignal) => {
    const attempt = await generateText({
      model,
      instructions: ANSWER_INSTRUCTIONS,
      messages: [...past, { role: 'user', content: answerPrompt({ question, chunks, place, today }) }],
      tools,
      // Up to two tool rounds, then the structured answer (which is a step of its own).
      stopWhen: isStepCount(4),
      output: Output.object({ schema: answerSchema }),
      maxOutputTokens: 800,
      maxRetries: 0,
      abortSignal,
    })
    const problem = rejected.length < MAX_REJECTED ? problemWith(attempt.output, calledRisk(attempt)) : null
    if (problem) {
      rejected.push(problem)
      throw new Error(`answer rejected: ${problem}`)
    }
    return attempt
  })

  // When the other models are out of quota the chain can end on a refused answer, which is a known
  // outcome, not an outage.
  const written = await writeAnswer().catch((err: unknown) => {
    if (rejected.length === 0) throw err
    return null
  })
  if (!written) return giveUp(rejected, {})
  const { result, modelUsed: answeredBy } = written

  const toolCalls = result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName))
  const usage = {
    inputTokens: (read.usage.inputTokens ?? 0) + (result.usage.inputTokens ?? 0),
    cachedInputTokens: (read.usage.inputTokenDetails?.cacheReadTokens ?? 0) + (result.usage.inputTokenDetails?.cacheReadTokens ?? 0),
    outputTokens: (read.usage.outputTokens ?? 0) + (result.usage.outputTokens ?? 0),
  }
  const meta = { promptVersion: PROMPT_VERSION, rejected, shown: [...shown.keys()], toolCalls, models: [readBy, answeredBy], ...usage }

  const out = result.output
  if (out.answer.trim() === OUT_OF_SCOPE && !mustAnswer) return { ...fixed('off_topic', OUT_OF_SCOPE), meta: { ...meta, redacted: false, named: false } }

  // The last model allowed gets no further chance: what it wrote is checked, never shown unchecked.
  const problem = problemWith(out, calledRisk(result))
  if (problem) return giveUp([...rejected, problem], meta)

  const sourceIds = validSources(out.sources, [...shown.keys()])

  const { text, redacted, named } = sanitizeAnswer(out.answer)
  return {
    answer: text,
    sources: sourceIds.map((id) => {
      const c = shown.get(id)!
      return { id, title: c.title, source: c.source, href: c.href }
    }),
    escalate: out.escalate,
    kind: 'question',
    note: EXPERIMENTAL_NOTE,
    meta: { ...meta, redacted, named },
  }
}
