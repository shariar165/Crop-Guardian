import { headers } from 'next/headers'
import { checkQuestion, UNAVAILABLE } from '@/lib/assistant/guard'
import { CROP_IDS } from '@/lib/crops'
import { askOnServer, underDailyLimit } from '@/lib/assistant/server'

const LIMIT_REACHED = 'আজকের প্রশ্নের সীমা শেষ। কাল আবার জিজ্ঞেস করুন, বা উপসহকারী কৃষি কর্মকর্তার সাথে কথা বলুন।'

// A farmer's question to «কৃষি সহায়ক»: { question, history: [{ q, a }], crop }, where crop is the
// field in season on their phone, or the crop they just tapped. No account needed. The
// answer comes back whole (not streamed) so the guards in src/lib/assistant/guard.ts run first.
export async function POST(request: Request) {
  let body: { question?: unknown; history?: unknown; crop?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Expected JSON' }, { status: 400 })
  }
  const check = checkQuestion(body.question)
  if (!check.ok) return Response.json({ error: check.reason === 'long' ? 'Question too long' : 'Question is empty' }, { status: 400 })

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  try {
    if (!(await underDailyLimit(ip))) return Response.json({ answer: LIMIT_REACHED, sources: [], escalate: true, note: null }, { status: 429 })
    const field = CROP_IDS.find((c) => c === body.crop) ?? null
    const { meta, ...result } = await askOnServer(check.text, body.history, field)
    // One line per answer for the logs: which prompt, what it read, what it cost. Never the question.
    console.info('ask', JSON.stringify({ kind: result.kind, sources: result.sources.map((s) => s.id), ...meta }))
    return Response.json(result)
  } catch (err) {
    console.error('Assistant failed:', err)
    return Response.json({ answer: UNAVAILABLE, sources: [], escalate: false, note: null }, { status: 503 })
  }
}
