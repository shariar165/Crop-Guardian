// Every model the assistant uses, through the Vercel AI Gateway (plain "provider/model" strings).
// The small model does the cheap step on every question; the larger one only writes answers.
export const MODELS = {
  // Reads the question: in scope or not, and what to search for.
  rewrite: 'anthropic/claude-haiku-5.5',
  // Writes the Bengali answer from the sources found.
  answer: 'anthropic/claude-sonnet-5.5',
  // Grades answers in scripts/eval-assistant.ts; never used on a farmer's question.
  judge: 'anthropic/claude-sonnet-5.5',
  embedding: 'google/gemini-embedding-001',
  rerank: 'cohere/rerank-v3.5',
} as const

// Tried by the gateway, in order, when the first model fails, so a farmer still gets an answer.
export const FALLBACKS = {
  rewrite: ['google/gemini-3.1-flash-lite'],
  answer: ['google/gemini-3.6-flash'],
} as const

// gemini-embedding-001 can return fewer dimensions; 768 keeps the vectors small and its Bengali
// retrieval good enough for a few dozen chunks.
export const EMBED_DIMS = 768
export const embedOptions = { google: { outputDimensionality: EMBED_DIMS } }
