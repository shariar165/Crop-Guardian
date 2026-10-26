import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { placeOf, unionById } from '@/lib/areas'
import { KB } from '@/lib/assistant/kb'
import { searchKb } from '@/lib/assistant/retrieve'
import { CROPS } from '@/lib/crops'
import { daysBetween, isIsoDate, todayIn } from '@/lib/dates'
import { db } from '@/lib/db'
import { diagnosisClasses, findUnions } from '@/lib/mcpTools'
import { riskAt } from '@/lib/riskAt'
import { fetchHourlyPast, MAX_PAST_DAYS } from '@/lib/weather'

// Crop Guardian as an MCP server (Streamable HTTP), so an agriculture officer's AI assistant or
// another agent can use the same risk engine, area index and advice as the app. Read-only.
// With MCP_SECRET set, every call needs "Authorization: Bearer <MCP_SECRET>".

const crop = z.enum(['potato', 'paddy']).describe('potato: late blight (Hutton criteria); paddy: rice blast (experimental rule)')
const unionId = z.string().describe('A union id from find_union, e.g. "bogura-shibganj.kichak"')

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] })
const fail = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true })

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'find_union',
      {
        title: 'Find a union',
        description: 'Find union ids by a union, upazila or district name, in Bengali or English. The app covers the Rangpur and Rajshahi divisions and Munshiganj.',
        inputSchema: z.object({ query: z.string().min(1) }),
        annotations: { readOnlyHint: true },
      },
      async ({ query }) => json(findUnions(query)),
    )

    server.registerTool(
      'get_risk',
      {
        title: "Today's disease risk",
        description: "Today's and the next days' disease risk at a union from the Open-Meteo forecast: safe, watch or danger, with the reason in Bengali.",
        inputSchema: z.object({ unionId, crop }),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ unionId, crop }) => {
        const union = unionById(unionId)
        if (!union) return fail(`Unknown union id "${unionId}". Use find_union first.`)
        try {
          return json(await riskAt(placeOf(union), crop))
        } catch {
          return fail('The weather forecast is unavailable right now.')
        }
      },
    )

    server.registerTool(
      'get_season_risk',
      {
        title: 'Past risk this season',
        description: `The risk of every past day from a date through today at a union, from the weather archive (up to ${MAX_PAST_DAYS} days).`,
        inputSchema: z.object({ unionId, crop, from: z.string().describe('YYYY-MM-DD, in the past') }),
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ unionId, crop, from }) => {
        const union = unionById(unionId)
        if (!union) return fail(`Unknown union id "${unionId}". Use find_union first.`)
        const today = todayIn()
        if (!isIsoDate(from) || from > today) return fail('from must be a past date, YYYY-MM-DD.')
        const place = placeOf(union)
        try {
          const hourly = await fetchHourlyPast(place.lat, place.lon, Math.min(daysBetween(from, today) + 1, MAX_PAST_DAYS))
          return json({ place: place.name, crop, days: CROPS[crop].classify(hourly).filter((d) => d.date >= from && d.date <= today) })
        } catch {
          return fail('Past weather is unavailable right now.')
        }
      },
    )

    server.registerTool(
      'search_guide',
      {
        title: "Search the app's advice",
        description: "Search Crop Guardian's Bengali advice (potato growing, late blight, storage, paddy blast, using the app). Returns the matching passages with their sources. Never contains doses.",
        inputSchema: z.object({ query: z.string().min(1).describe('A Bengali question or phrase') }),
        annotations: { readOnlyHint: true },
      },
      async ({ query }) => {
        try {
          const pool = db()
          const chunks = await searchKb((sql, params) => pool.query(sql, params), query, [])
          return json(chunks.map(({ id, title, source, href, text }) => ({ id, title, source, href, text })))
        } catch {
          return fail('The advice search is unavailable right now.')
        }
      },
    )

    server.registerTool(
      'diagnosis_classes',
      {
        title: 'What the photo diagnosis can name',
        description: "The potato leaf diseases the app's on-device model recognises, how a farmer can see each, and the app's steps.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async () => json(diagnosisClasses()),
    )

    server.registerResource(
      'advice',
      'crop-guardian://advice',
      { title: "Crop Guardian's advice", description: 'Every passage the assistant answers from, with its source.', mimeType: 'text/markdown' },
      async (uri) => ({
        contents: [{ uri: uri.href, text: KB.map((c) => `## ${c.title}\n${c.text}\n\nসূত্র: ${c.source}`).join('\n\n') }],
      }),
    )
  },
  { serverInfo: { name: 'crop-guardian', version: '1.0.0' } },
)

const secret = process.env.MCP_SECRET
const authed = withMcpAuth(handler, (_req, token) => (secret && token === secret ? { token, clientId: 'crop-guardian', scopes: [] } : undefined), {
  required: Boolean(secret),
})

export { authed as GET, authed as POST }
