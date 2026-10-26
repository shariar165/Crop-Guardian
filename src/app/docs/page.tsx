import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import BacktestChart from '@/components/BacktestChart'
import TopBar from '@/components/TopBar'
import { KB } from '@/lib/assistant/kb'
import { FALLBACKS, MODELS } from '@/lib/assistant/models'
import { PROMPT_VERSION } from '@/lib/assistant/prompts'
import { DIVISIONS } from '@/lib/areas'
import { parseBacktest, parseEvalSummary } from '@/lib/docsData'

export const metadata = { title: 'Crop Guardian — how it works' }

// A page for judges, partners and agronomists: what the app does, what evidence there is and how
// AI is used. It is in English, unlike the farmer's screens, because those are its readers.
// Built at build time from the reports in docs/, so it always matches them.

const read = (file: string) => {
  const path = join(process.cwd(), 'docs', file)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const districts = DIVISIONS.flatMap((v) => v.districts)
const unions = districts.flatMap((d) => d.upazilas.flatMap((u) => u.unions))

const AI_STACK: { part: string; how: string; where: string }[] = [
  { part: 'Leaf diagnosis', how: 'EfficientNet-B0 fine-tuned on field photos, exported to ONNX; temperature scaling, a conformal prediction set (α = 0.1) and an out-of-distribution score', where: 'On the phone (onnxruntime-web in a Web Worker), offline. Photos never leave the phone.' },
  { part: 'Weather risk', how: 'Hutton criteria for potato late blight, a draft rule for rice blast; no ML, so every alert can be explained', where: 'Server, Open-Meteo forecast per union' },
  { part: 'কৃষি সহায়ক (assistant)', how: `RAG over the app's own advice: ${MODELS.rewrite} reads the question, hybrid search (pgvector + Bengali full-text, fused by reciprocal rank), ${MODELS.rerank} reranks, ${MODELS.answer} answers with tools and a structured output`, where: `Server, Vercel AI Gateway, falls back to ${FALLBACKS.answer[0]}` },
  { part: 'MCP server', how: 'find_union, get_risk, get_season_risk, search_guide, diagnosis_classes and the advice as a resource, over Streamable HTTP', where: '/api/mcp, for an officer’s or partner’s AI tools' },
]

const SAFETY = [
  'The model says «চিনতে পারিনি» (I don’t recognise this) instead of guessing, and the more cautious of two photos wins.',
  'No dose, anywhere: the advice says “follow the label”, a test enforces it, and the assistant’s answers pass a dose filter before the farmer sees them.',
  'The assistant answers only from vetted passages, cites them, and may cite only passages it was shown. Phone numbers are removed before a question reaches a model.',
  'Every result is labelled experimental, and uncertain cases are sent to the Sub-Assistant Agriculture Officer.',
  'Signed-out by default. SMS alerts store only the union and planting dates. Officers’ pages are checked on the server.',
]

const LIMITS = [
  'The diagnosis thresholds were fitted on Indonesian field photos, not Bangladeshi ones; 20–30 officer-labelled local photos are the next step.',
  'The risk rule is checked against two weather reanalyses, not yet against recorded outbreaks.',
  'The rice-blast rule is a draft, labelled experimental in the app.',
  'The assistant knows only what the app’s advice says; it is a way to find that advice, not an agronomist.',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="stitch-lg flex flex-col gap-2.5 rounded-[20px] p-4">
      <h2 className="m-0 font-display text-[19px] leading-[1.2] font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

export default function DocsPage() {
  const backtest = parseBacktest(read('risk-backtest.md')).filter((r) => r.appRule)
  const seasons = [...new Set(backtest.map((r) => r.season))]
  const chart = seasons.map((season) => ({
    season,
    openMeteo: backtest.find((r) => r.season === season && r.source.includes('Open-Meteo'))?.alerts ?? 0,
    nasa: backtest.find((r) => r.season === season && r.source.includes('NASA'))?.alerts ?? 0,
  }))
  const winterDays = backtest[0]?.days ?? 90
  const evalSummary = parseEvalSummary(read('assistant-eval.md'))

  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="How it works" right={<span className="size-11" />} />

      <div className="flex flex-col gap-3 px-4 pb-6 text-[15px] leading-[1.5]">
        <Section title="Crop Guardian">
          <p className="m-0">
            A Bengali, phone-first app that tells potato farmers in northern Bangladesh when late blight weather is coming, recognises the disease from a leaf photo on the
            phone, and admits when it is unsure. Late blight can cut the country’s potato yield by up to 30%, and many farmers spray every week by the calendar whatever the
            weather.
          </p>
          <ul className="m-0 grid grid-cols-3 gap-2 p-0 text-center">
            {[
              [String(districts.length), 'districts'],
              [unions.length.toLocaleString('en'), 'unions'],
              [String(KB.length), 'advice passages'],
            ].map(([n, label]) => (
              <li key={label} className="flex list-none flex-col rounded-[14px] bg-sand px-2 py-2.5">
                <span className="font-display text-[22px] font-extrabold">{n}</span>
                <span className="text-[12px] text-muted">{label}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Fewer sprays, when they matter">
          <p className="m-0">
            Alerts the app’s rule would have sent each winter, from two independent weather sources, against one spray a week ({Math.floor(winterDays / 7)} a winter).
          </p>
          {chart.length > 0 ? <BacktestChart data={chart} calendarSprays={Math.floor(winterDays / 7)} /> : <p className="m-0 text-muted">Run scripts/find-hutton-periods.ts --write.</p>}
        </Section>

        <Section title="How AI is used">
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {AI_STACK.map((a) => (
              <li key={a.part} className="flex flex-col gap-0.5 border-l-4 border-sun pl-3">
                <span className="font-bold">{a.part}</span>
                <span className="text-[14px]">{a.how}</span>
                <span className="text-[13px] text-muted">{a.where}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Evidence">
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
            <li>App = notebook: the app’s preprocessing and decision give the training notebook’s result on all 12 reference images (parity.test.ts).</li>
            <li>Risk rule replayed over three winters with two weather reanalyses (docs/risk-backtest.md); rice blast over three Boro and Aman seasons.</li>
            <li>Over 200 automated tests, including no-dose, SMS length and two-line text limits.</li>
          </ul>
          <h3 className="m-0 mt-1 text-[16px] font-bold">Assistant evaluation (prompt {PROMPT_VERSION})</h3>
          {evalSummary.length > 0 ? (
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {evalSummary.map((r) => (
                  <tr key={r.check} className="border-b border-line">
                    <td className="py-1 pr-2">{r.check}</td>
                    <td className="py-1 text-right font-semibold whitespace-nowrap">{r.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="m-0 text-muted">Not run yet: npx tsx scripts/eval-assistant.ts --write.</p>
          )}
        </Section>

        <Section title="Safety and privacy">
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
            {SAFETY.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Section>

        <Section title="What it can’t do yet">
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
            {LIMITS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Section>

        <p className="m-0 text-center text-[14px]">
          <Link href="/" className="font-bold text-teal">
            Open the app →
          </Link>
        </p>
      </div>
    </div>
  )
}
