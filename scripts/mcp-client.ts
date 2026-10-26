// A client for the app's MCP server (src/app/api/mcp): lists its tools and resources and calls a
// few, to check the server end to end. With --ask, a model answers an officer's question using
// only the server's tools, as an officer's own AI assistant would.
//
// Run, with the app running (npm run dev):
//   npx tsx scripts/mcp-client.ts [url]                      (default http://localhost:3000/api/mcp)
//   npx tsx scripts/mcp-client.ts [url] --ask "শিবগঞ্জের কিচক ইউনিয়নে আজ আলুর ধসার ঝুঁকি কেমন?"
// MCP_SECRET from .env.local is sent as the bearer token when set.
import { existsSync } from 'node:fs'
import { createMCPClient } from '@ai-sdk/mcp'
import { generateText, isStepCount } from 'ai'
import { withFallback } from '@/lib/assistant/models'

// The text parts of a tool result (a legacy "toolResult" answer has none).
const text = (result: object): string =>
  'content' in result && Array.isArray(result.content) ? result.content.map((c: { text?: string }) => c.text ?? '').join('\n') : ''

async function main() {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
  const args = process.argv.slice(2)
  const askAt = args.indexOf('--ask')
  const question = askAt >= 0 ? args[askAt + 1] : null
  const url = args.find((a, i) => !a.startsWith('--') && (askAt < 0 || i !== askAt + 1)) ?? 'http://localhost:3000/api/mcp'
  const secret = process.env.MCP_SECRET

  const client = await createMCPClient({ transport: { type: 'http', url, headers: secret ? { Authorization: `Bearer ${secret}` } : undefined } })
  try {
    const { tools } = await client.listTools()
    console.log(`Tools (${tools.length}): ${tools.map((t) => t.name).join(', ')}`)
    const { resources } = await client.listResources()
    console.log(`Resources: ${resources.map((r) => r.uri).join(', ')}`)

    if (question) {
      const tools = await client.tools()
      const { result, modelUsed } = await withFallback('answer', (model, abortSignal) =>
        generateText({
          model,
          instructions: 'You help a Bangladeshi agriculture officer. Use the Crop Guardian tools; answer in short Bengali. Never give a pesticide dose.',
          prompt: question,
          tools,
          stopWhen: isStepCount(6),
          maxRetries: 0,
          abortSignal,
        }),
      )
      console.log(`\nModel: ${modelUsed}`)
      console.log(`\nTools used: ${result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)).join(' → ') || 'none'}`)
      console.log(`\n${result.text}`)
      return
    }

    const unions = JSON.parse(text(await client.callTool({ name: 'find_union', arguments: { query: 'কিচক' } })))
    console.log(`\nfind_union("কিচক") → ${unions[0]?.id} (${unions[0]?.name})`)
    const risk = await client.callTool({ name: 'get_risk', arguments: { unionId: unions[0].id, crop: 'potato' } })
    console.log(`get_risk → ${text(risk).slice(0, 300)}`)
    const classes = await client.callTool({ name: 'diagnosis_classes', arguments: {} })
    console.log(`diagnosis_classes → ${text(classes).slice(0, 200)}…`)
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
