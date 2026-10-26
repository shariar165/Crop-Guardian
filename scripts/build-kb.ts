// Fills the assistant's knowledge base (the "kb_chunk" table) from src/lib/assistant/kb.ts: embeds
// each chunk through the AI Gateway and stores its stemmed words for the keyword search. Chunks no
// longer in kb.ts are deleted. Run again whenever the advice text changes.
//
// Run: npm run db:migrate, then npx tsx scripts/build-kb.ts   (DATABASE_URL and gateway auth from .env.local)
import { existsSync } from 'node:fs'
import { Pool } from '@neondatabase/serverless'
import { embedMany, gateway } from 'ai'
import { KB, searchText } from '@/lib/assistant/kb'
import { embedOptions, MODELS } from '@/lib/assistant/models'
import { toVector } from '@/lib/assistant/retrieve'
import { stemmedText } from '@/lib/assistant/tokens'

async function main() {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
  const texts = KB.map(searchText)
  const { embeddings, usage } = await embedMany({ model: gateway.embeddingModel(MODELS.embedding), values: texts, providerOptions: embedOptions })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    for (const [i, c] of KB.entries()) {
      await pool.query(
        `INSERT INTO kb_chunk ("id", "title", "source", "href", "context", "text", "embedding", "tsv", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, to_tsvector('simple', $8), now())
         ON CONFLICT ("id") DO UPDATE SET "title" = $2, "source" = $3, "href" = $4, "context" = $5, "text" = $6,
           "embedding" = $7::vector, "tsv" = to_tsvector('simple', $8), "updatedAt" = now()`,
        [c.id, c.title, c.source, c.href, c.context, c.text, toVector(embeddings[i]), stemmedText(texts[i])],
      )
    }
    const { rowCount } = await pool.query('DELETE FROM kb_chunk WHERE NOT ("id" = ANY($1))', [KB.map((c) => c.id)])
    console.log(`${KB.length} chunks embedded (${usage.tokens} tokens, ${MODELS.embedding}); ${rowCount ?? 0} old chunks removed.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
