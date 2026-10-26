// «কৃষি সহায়ক»: answers a farmer's question from the app's own advice (src/lib/assistant/kb.ts).
//   1. The small model reads the question: greeting, off topic, or a question, and what to search.
//   2. searchKb finds the chunks (hybrid search + rerank).
//   3. The answer model writes from those chunks. It may search again or ask for today's risk
//      through tools, and returns a structured answer with the ids of the chunks it used.
//   4. guard.ts drops doses and invented sources before anything reaches the farmer.
// No server-only import: scripts/eval-assistant.ts runs the same code with its own database client.
import { generateText, isStepCount, type ModelMessage, Output, tool } from 'ai'
import { z } from 'zod'
import { type CropId } from '@/lib/crops'
import { DAY_STATE, type Risk } from '@/lib/data'
import { EXPERIMENTAL_NOTE, HISTORY_TURNS, MAX_ANSWER, MAX_QUESTION, NO_SOURCE, OUT_OF_SCOPE, redactPhones, sanitizeAnswer, validSources } from './guard'
import type { KbChunk } from './kb'
import { FALLBACKS, MODELS } from './models'
import { ANSWER_INSTRUCTIONS, answerPrompt, PROMPT_VERSION, REWRITE_INSTRUCTIONS } from './prompts'
import { type Query, searchKb } from './retrieve'

export const GREETING = 'নমস্কার, আসসালামু আলাইকুম! আলুর নাবি ধসা, আলু চাষ, ধানের ব্লাস্ট বা এই অ্যাপ নিয়ে যা জানতে চান, লিখুন।'

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
    shown: string[]
    toolCalls: string[]
    inputTokens: number
    cachedInputTokens: number
    outputTokens: number
  }
}

const rewriteSchema = z.object({
  kind: z.enum(['greeting', 'off_topic', 'question']),
  queries: z.array(z.string()).max(3).describe('Short Bengali search phrases with root words'),
  crop: z.enum(['potato', 'paddy']).nullable(),
  wantsRisk: z.boolean(),
})

const answerSchema = z.object({
  answer: z.string().describe('The Bengali answer, at most four sentences'),
  sources: z.array(z.string()).describe('Ids of the <source> blocks actually used'),
  escalate: z.boolean().describe('True when the farmer should contact the officer or send a leaf photo'),
})

// The fixed instructions get a cache breakpoint: they are the same for every farmer, so after the
// first question the provider reads them from cache at a tenth of the price.
const cached = (content: string) => ({
  role: 'system' as const,
  content,
  providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' as const } } },
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
  meta: { promptVersion: PROMPT_VERSION, redacted: false, shown: [], toolCalls: [], inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
})

export async function ask(
  { question, history = [], place, today }: { question: string; history?: unknown; place: string; today: string },
  deps: AskDeps,
): Promise<AskResult> {
  const past = historyMessages(history)

  const read = await generateText({
    model: MODELS.rewrite,
    instructions: cached(REWRITE_INSTRUCTIONS),
    messages: [...past, { role: 'user', content: question }],
    output: Output.object({ schema: rewriteSchema }),
    providerOptions: { gateway: { models: [...FALLBACKS.rewrite], tags: ['ask', 'rewrite'] } },
  })
  const plan = read.output
  if (plan.kind === 'greeting') return fixed('greeting', GREETING)
  if (plan.kind === 'off_topic') return fixed('off_topic', OUT_OF_SCOPE)

  const chunks = await searchKb(deps.query, question, plan.queries)
  // Every chunk the model is shown, from the first search or its own; it may cite only these.
  const shown = new Map(chunks.map((c) => [c.id, c]))

  const tools = {
    searchGuide: tool({
      description: "Search the app's advice again with a different Bengali phrase.",
      inputSchema: z.object({ phrase: z.string().describe('A short Bengali search phrase with root words') }),
      execute: async ({ phrase }) => {
        const found = await searchKb(deps.query, phrase, [])
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
        return { place: r.place, today: word(r.today), reason: r.reason, days: r.days.map((d) => `${d.date}: ${word(d.risk)}`) }
      },
    }),
  }

  const result = await generateText({
    model: MODELS.answer,
    instructions: cached(ANSWER_INSTRUCTIONS),
    messages: [...past, { role: 'user', content: answerPrompt({ question, chunks, place, today }) }],
    tools,
    // Up to two tool rounds, then the structured answer (which is a step of its own).
    stopWhen: isStepCount(4),
    output: Output.object({ schema: answerSchema }),
    maxOutputTokens: 800,
    providerOptions: { gateway: { models: [...FALLBACKS.answer], tags: ['ask', 'answer'] } },
  })

  const toolCalls = result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName))
  const usage = {
    inputTokens: (read.usage.inputTokens ?? 0) + (result.usage.inputTokens ?? 0),
    cachedInputTokens: (read.usage.inputTokenDetails?.cacheReadTokens ?? 0) + (result.usage.inputTokenDetails?.cacheReadTokens ?? 0),
    outputTokens: (read.usage.outputTokens ?? 0) + (result.usage.outputTokens ?? 0),
  }
  const meta = { promptVersion: PROMPT_VERSION, shown: [...shown.keys()], toolCalls, ...usage }

  const out = result.output
  if (out.answer.trim() === OUT_OF_SCOPE) return { ...fixed('off_topic', OUT_OF_SCOPE), meta: { ...meta, redacted: false } }

  const sourceIds = validSources(out.sources, [...shown.keys()])
  // A risk answer is grounded in the forecast tool even when no advice chunk was used.
  const grounded = sourceIds.length > 0 || toolCalls.includes('todayRisk')
  if (!grounded) return { ...fixed('question', NO_SOURCE), escalate: true, meta: { ...meta, redacted: false } }

  const { text, redacted } = sanitizeAnswer(out.answer)
  return {
    answer: text,
    sources: sourceIds.map((id) => {
      const c = shown.get(id)!
      return { id, title: c.title, source: c.source, href: c.href }
    }),
    escalate: out.escalate,
    kind: 'question',
    note: EXPERIMENTAL_NOTE,
    meta: { ...meta, redacted },
  }
}
