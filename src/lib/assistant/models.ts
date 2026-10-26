// Every model the assistant uses, called directly with each provider's free API key (no card
// needed). Only this file knows the providers.
//   GROQ_API_KEY                  reads and answers (required)   https://console.groq.com/keys
//   GOOGLE_GENERATIVE_AI_API_KEY  embeddings (required), fallback, judge   https://aistudio.google.com/apikey
//   OPENROUTER_API_KEY            optional fallback              https://openrouter.ai/keys
//   COHERE_API_KEY                optional reranker              https://dashboard.cohere.com/api-keys
// Each role tries its models in order and skips a provider without a key, so a free tier's rate
// limit or a busy model (Gemini Flash is often "experiencing high demand") never stops an answer.
import { cohere } from '@ai-sdk/cohere'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

type Provider = 'groq' | 'google' | 'openrouter'
type ModelRef = { provider: Provider; id: string }

const KEY: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
}

// OpenRouter speaks the OpenAI API; its ":free" models need no credit. Built on use, because the
// scripts load .env.local after importing this file.
const openrouter = (id: string) =>
  createOpenAICompatible({
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    supportsStructuredOutputs: true,
  }).chatModel(id)

const build = ({ provider, id }: ModelRef): LanguageModel => (provider === 'groq' ? groq(id) : provider === 'google' ? google(id) : openrouter(id))

const QWEN: ModelRef = { provider: 'groq', id: 'qwen/qwen3.8-27b' }
const GPT_OSS: ModelRef = { provider: 'groq', id: 'openai/gpt-oss-120b' }
// The "-latest" aliases follow Google's current free-tier models, so a retired id never breaks this.
const GEMINI: ModelRef = { provider: 'google', id: 'gemini-flash-latest' }
const GEMINI_LITE: ModelRef = { provider: 'google', id: 'gemini-flash-lite-latest' }
const GEMMA: ModelRef = { provider: 'openrouter', id: 'google/gemma-4-31b-it:free' }

// Chosen by a test of tool use + structured output in Bengali (Qwen on Groq: under a second;
// Gemini Flash-Lite: correct but ~20 s). The judge tries other families than the answerer first, so
// it seldom grades its own writing (the eval report says who graded).
const CHAINS = {
  rewrite: [QWEN, GEMINI_LITE, GEMMA],
  answer: [QWEN, GEMINI, GEMMA, GPT_OSS, GEMINI_LITE],
  judge: [GEMINI, GEMINI_LITE, GEMMA, GPT_OSS],
} as const satisfies Record<string, ModelRef[]>

export type Role = keyof typeof CHAINS

const name = (m: ModelRef) => `${m.provider}/${m.id}`
const keyed = (m: ModelRef) => Boolean(process.env[KEY[m.provider]])

// As shown in logs, docs/assistant-eval.md and /docs.
export const MODELS = {
  rewrite: name(CHAINS.rewrite[0]),
  answer: name(CHAINS.answer[0]),
  judge: name(CHAINS.judge[0]),
  fallbacks: [...new Set([...CHAINS.answer.slice(1), ...CHAINS.rewrite.slice(1)].map(name))],
  embedding: 'google/gemini-embedding-001',
  rerank: 'cohere/rerank-v3.5',
} as const

// A model that hangs is worse than one that fails: give up and try the next.
const ATTEMPT_TIMEOUT_MS = 30_000

// Runs `call` with each of the role's models in turn until one answers, and says which one did.
export async function withFallback<T>(role: Role, call: (model: LanguageModel, signal: AbortSignal) => Promise<T>): Promise<{ result: T; modelUsed: string }> {
  const chain = CHAINS[role].filter(keyed)
  if (chain.length === 0) throw new Error(`No API key for any ${role} model (see src/lib/assistant/models.ts)`)
  let last: unknown
  for (const m of chain) {
    try {
      return { result: await call(build(m), AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)), modelUsed: name(m) }
    } catch (err) {
      last = err
      console.error(`Assistant ${role}: ${name(m)} failed, trying the next model:`, err instanceof Error ? err.message : err)
    }
  }
  throw last
}

export const embeddingModel = () => google.embeddingModel('gemini-embedding-001')
// Optional: without a Cohere key, search keeps the fused order.
export const rerankingModel = () => (process.env.COHERE_API_KEY ? cohere.reranking('rerank-v3.5') : null)

// gemini-embedding-001 can return fewer dimensions; 768 keeps the vectors small and its Bengali
// retrieval good enough for a few dozen chunks. Passages and questions are embedded for their task.
export const EMBED_DIMS = 768
export const embedOptions = (task: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY') => ({ google: { outputDimensionality: EMBED_DIMS, taskType: task } })
