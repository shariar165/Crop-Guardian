// Runs the app's photo diagnosis on a folder of labelled leaf photos, e.g. 20–30 taken in
// Bangladeshi fields, to see how the model holds up outside the data it was calibrated on.
// It uses the real ONNX model and the app's own preprocessing and decision (as parity.test.ts does).
//
//   <dir>/late_blight/*.jpg   <dir>/healthy/*.jpg   <dir>/early_blight/*.jpg   (the model's classes)
//   <dir>/unseen/*.jpg        other diseases or pests the model never saw: it should say "unknown"
//
// Run: npx tsx scripts/eval-field-photos.ts <dir> [--write]   (--write saves docs/field-photo-test.md)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseConfig } from '@/lib/diagnosis/config'
import { decide, type PhotoResult } from '@/lib/diagnosis/decide'
import { resizeGeometry, toTensor } from '@/lib/diagnosis/preprocess'
import { todayIn } from '@/lib/dates'

const DOC = 'docs/field-photo-test.md'
const UNSEEN = 'unseen'
const IMAGE = /\.(jpe?g|png|webp)$/i

type Outcome = { file: string; truth: string; result: PhotoResult }

// What a farmer would be told, judged against the truth. "Misleading" is the one that matters:
// a confident wrong answer, or a shortlist that leaves the real disease out.
function verdict({ truth, result }: Outcome): 'right' | 'shortlist' | 'unknown' | 'misleading' {
  const { decision, candidates } = result
  if (truth === UNSEEN) return decision === 'unknown' ? 'right' : 'misleading'
  if (decision === 'unknown') return 'unknown'
  if (!candidates.includes(truth)) return 'misleading'
  return decision === 'confident' ? 'right' : 'shortlist'
}

const pct = (n: number, of: number) => (of === 0 ? '—' : `${Math.round((100 * n) / of)}%`)

function markdown(outcomes: Outcome[], groups: string[], diseases: string[], dir: string): string {
  const rows = groups.map((g) => {
    const mine = outcomes.filter((o) => o.truth === g)
    const count = (v: ReturnType<typeof verdict>) => mine.filter((o) => verdict(o) === v).length
    return { g, n: mine.length, right: count('right'), shortlist: count('shortlist'), unknown: count('unknown'), misleading: count('misleading') }
  })
  const confident = outcomes.filter((o) => o.truth !== UNSEEN && o.result.decision === 'confident')
  const total = outcomes.length
  const misleading = rows.reduce((sum, r) => sum + r.misleading, 0)
  return [
    '# Field-photo test',
    '',
    `The app's photo diagnosis on ${total} labelled photos from \`${dir}\`, one photo at a time, with the real model and the app's own preprocessing and thresholds.`,
    '',
    '| Folder | Photos | Right | Shortlist with the right answer | "Unknown" | Misleading |',
    '|---|--:|--:|--:|--:|--:|',
    ...rows.map((r) => `| ${r.g} | ${r.n} | ${r.right} | ${r.shortlist} | ${r.unknown} | ${r.misleading} |`),
    '',
    `**Misleading: ${misleading} of ${total} (${pct(misleading, total)})**: a confident wrong answer, a shortlist without the real disease, or an unseen disease not called "unknown". ` +
      `For \`${UNSEEN}\`, "right" means the app said "unknown".`,
    '',
    '## Confident answers',
    '',
    `| Truth \\ App | ${diseases.join(' | ')} |`,
    `|---|${diseases.map(() => '--:').join('|')}|`,
    ...groups
      .filter((g) => g !== UNSEEN)
      .map((g) => `| ${g} | ${diseases.map((d) => confident.filter((o) => o.truth === g && o.result.candidates[0] === d).length).join(' | ')} |`),
    '',
    `Accuracy of confident answers: ${pct(confident.filter((o) => o.result.candidates[0] === o.truth).length, confident.length)} of ${confident.length}.`,
    '',
    `Generated on ${todayIn()} by \`npx tsx scripts/eval-field-photos.ts <dir> --write\`.`,
    '',
  ].join('\n')
}

async function main() {
  const dir = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!dir) throw new Error('Usage: npx tsx scripts/eval-field-photos.ts <dir> [--write]')
  const config = parseConfig(JSON.parse(readFileSync(join('public', 'model', 'crop_guardian_config.json'), 'utf8')))
  const known = new Set([...config.diseases, UNSEEN])
  const groups = readdirSync(dir).filter((g) => statSync(join(dir, g)).isDirectory())
  const unknownGroups = groups.filter((g) => !known.has(g))
  if (unknownGroups.length) throw new Error(`Folders must be ${[...known].join(', ')}; not ${unknownGroups.join(', ')}`)

  const [{ default: sharp }, ort] = await Promise.all([import('sharp'), import('onnxruntime-node')])
  const session = await ort.InferenceSession.create(join('public', 'model', config.modelFile))
  const outcomes: Outcome[] = []
  for (const truth of groups) {
    for (const file of readdirSync(join(dir, truth)).filter((f) => IMAGE.test(f))) {
      // Phone photos carry their rotation in EXIF; the browser applies it, so do the same here.
      const image = sharp(join(dir, truth, file)).rotate()
      const { width = 0, height = 0 } = await image.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info)
      const g = resizeGeometry(width, height, config)
      const { data } = await image
        .resize(g.width, g.height, { fit: 'fill', kernel: 'linear' })
        .extract({ left: g.left, top: g.top, width: g.size, height: g.size })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      const input = new ort.Tensor('float32', toTensor(data, g.size, config), [1, 3, g.size, g.size])
      const output = await session.run({ [config.inputName]: input })
      const result = decide(Array.from(output[config.outputName].data as Float32Array), config)
      const outcome = { file: `${truth}/${file}`, truth, result }
      outcomes.push(outcome)
      console.log(`${outcome.file}: ${result.decision} [${result.candidates.join(', ')}] → ${verdict(outcome)}`)
    }
  }
  if (outcomes.length === 0) throw new Error(`No photos found under ${dir}`)

  const doc = markdown(outcomes, groups, config.diseases, dir)
  console.log(`\n${doc}`)
  if (process.argv.includes('--write')) {
    writeFileSync(DOC, doc)
    console.log(`Wrote ${DOC}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
