// Finds the knowledge-base chunks for a question: each search phrase runs twice in Postgres, by
// meaning (pgvector cosine distance) and by words (full-text search over stemmed Bengali), the
// lists are fused by reciprocal rank, and a reranker orders what is left against the question.
// Every step degrades rather than fails: no embeddings → words only; no reranker → fused order.
import { embedMany, gateway, rerank } from 'ai'
import type { KbChunk } from './kb'
import { embedOptions, MODELS } from './models'
import { stemmedText } from './tokens'

// Any Postgres client's query(); the app passes its Neon pool, scripts their own.
export type Query = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>

// Results kept from each search; fused candidates sent to the reranker; chunks given to the model.
const PER_SEARCH = 8
const RERANK_POOL = 12
export const TOP_K = 5
// Cohere's relevance below which a chunk is about something else. Tuned on the eval set.
export const MIN_RELEVANCE = 0.05

// Reciprocal rank fusion: an id high in any list ranks high overall, without comparing the scores
// of different searches. k = 60 is the usual constant from the original paper.
export function rrf(lists: string[][], k = 60): string[] {
  const score = new Map<string, number>()
  for (const list of lists) list.forEach((id, rank) => score.set(id, (score.get(id) ?? 0) + 1 / (k + rank + 1)))
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

// websearch_to_tsquery never throws on user text; OR makes any stem a match, ranked by how many.
export const keywordQuery = (phrase: string): string => stemmedText(phrase).split(' ').filter(Boolean).join(' OR ')

export const toVector = (v: number[]): string => `[${v.join(',')}]`

async function embedPhrases(phrases: string[]): Promise<number[][] | null> {
  try {
    const { embeddings } = await embedMany({ model: gateway.embeddingModel(MODELS.embedding), values: phrases, providerOptions: embedOptions })
    return embeddings
  } catch (err) {
    console.error('Assistant embeddings failed, searching by words only:', err)
    return null
  }
}

const ids = (rows: Record<string, unknown>[]) => rows.map((r) => String(r.id))

const toChunk = (r: Record<string, unknown>): KbChunk => ({
  id: String(r.id),
  title: String(r.title),
  source: String(r.source),
  href: String(r.href),
  context: String(r.context),
  text: String(r.text),
})

export async function searchKb(query: Query, question: string, phrases: string[]): Promise<KbChunk[]> {
  const searches = [...new Set([question, ...phrases])].slice(0, 4)
  const vectors = await embedPhrases(searches)

  const lists = await Promise.all(
    searches.flatMap((phrase, i) => {
      const words = keywordQuery(phrase)
      const byWords = words
        ? query(
            `SELECT id FROM kb_chunk, websearch_to_tsquery('simple', $1) q WHERE tsv @@ q ORDER BY ts_rank(tsv, q) DESC LIMIT ${PER_SEARCH}`,
            [words],
          ).then((r) => ids(r.rows))
        : Promise.resolve([])
      const byMeaning = vectors
        ? query(`SELECT id FROM kb_chunk ORDER BY embedding <=> $1::vector LIMIT ${PER_SEARCH}`, [toVector(vectors[i])]).then((r) => ids(r.rows))
        : Promise.resolve([])
      return [byWords, byMeaning]
    }),
  )

  const fused = rrf(lists).slice(0, RERANK_POOL)
  if (fused.length === 0) return []
  const { rows } = await query('SELECT id, title, source, href, context, text FROM kb_chunk WHERE id = ANY($1)', [fused])
  const byId = new Map(rows.map((r) => [String(r.id), toChunk(r)]))
  const candidates = fused.flatMap((id) => byId.get(id) ?? [])

  try {
    const { ranking } = await rerank({
      model: gateway.rerankingModel(MODELS.rerank),
      query: question,
      documents: candidates.map((c) => `${c.title}\n${c.text}`),
      topN: TOP_K,
    })
    return ranking.filter((r) => r.score >= MIN_RELEVANCE).map((r) => candidates[r.originalIndex])
  } catch (err) {
    console.error('Assistant rerank failed, using fused order:', err)
    return candidates.slice(0, TOP_K)
  }
}
