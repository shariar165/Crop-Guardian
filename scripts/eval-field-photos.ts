// Runs the app's photo diagnosis on a folder of labelled leaf photos, e.g. 20–30 taken in
// Bangladeshi fields, to see how the model holds up outside the data it was calibrated on.
// It uses the real ONNX model and the app's own preprocessing and decision (as parity.test.ts does),
// and the camera's own quality check, to show which photos the camera would have asked to retake.
//
//   <dir>/late_blight/*.jpg   <dir>/healthy/*.jpg   <dir>/early_blight/*.jpg   (the crop model's classes)
//   <dir>/unseen/*.jpg        other diseases or pests the model never saw: it should say "unknown"
//   <dir>/ABOUT.md            optional: where the photos came from, put first in the report
//
// Run: npx tsx scripts/eval-field-photos.ts <dir> [--crop paddy] [--write]
// (--write saves docs/field-photo-test.md, or docs/field-photo-test-paddy.md for paddy)
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isCropId } from '@/lib/crops'
import { modelUrl, parseConfig } from '@/lib/diagnosis/config'
import { configUrlOf, leafNearOf } from '@/lib/diagnosis/crops'
import { decide, type PhotoResult } from '@/lib/diagnosis/decide'
import { resizeGeometry, toTensor } from '@/lib/diagnosis/preprocess'
import { todayIn } from '@/lib/dates'
import { isAcceptable, type QualityReport } from '@/lib/imageQuality'
import { qualityOfFile } from '@/lib/imageQualityNode'

const UNSEEN = 'unseen'
const IMAGE = /\.(jpe?g|png|webp)$/i

type Outcome = { file: string; truth: string; result: PhotoResult; quality: QualityReport; size: string; longSide: number }

// A phone photo's longer side is well above this; a smaller photo was resized before it reached us,
// so the camera's check (made for the phone's own frame) says little about it.
const PHONE_MIN_SIDE = 1000

// The camera's hint in English, in topHint's order (light first, since it spoils the other checks).
function flagOf(q: QualityReport): string | null {
  if (isAcceptable(q)) return null
  if (q.light !== 'ok') return q.light === 'dark' ? 'too dark' : 'too bright'
  if (q.leaf !== 'ok') return q.leaf === 'absent' ? 'no leaf' : 'too far'
  return 'blurry'
}

// What a farmer would be told, judged against the truth. "Misleading" is the one that matters:
// a confident wrong answer, or a shortlist that leaves the real disease out.
function verdict({ truth, result }: Outcome): 'right' | 'shortlist' | 'unknown' | 'misleading' {
  const { decision, candidates } = result
  if (truth === UNSEEN) return decision === 'unknown' ? 'right' : 'misleading'
  if (decision === 'unknown') return 'unknown'
  if (!candidates.includes(truth)) return 'misleading'
  return decision === 'confident' ? 'right' : 'shortlist'
}

// A percentage of a handful of photos looks more certain than it is, so under 10 only the count shows.
const MIN_FOR_PCT = 10
const pct = (n: number, of: number) => `${Math.round((100 * n) / of)}%`
const share = (n: number, of: number) => (of === 0 ? '—' : of < MIN_FOR_PCT ? `${n} of ${of}` : `${n} of ${of} (${pct(n, of)})`)

function markdown(outcomes: Outcome[], groups: string[], diseases: string[], dir: string, args: string, about: string): string {
  const rows = groups.map((g) => {
    const mine = outcomes.filter((o) => o.truth === g)
    const count = (v: ReturnType<typeof verdict>) => mine.filter((o) => verdict(o) === v).length
    return { g, n: mine.length, right: count('right'), shortlist: count('shortlist'), unknown: count('unknown'), misleading: count('misleading') }
  })
  const confident = outcomes.filter((o) => o.truth !== UNSEEN && o.result.decision === 'confident')
  const total = outcomes.length
  const misleading = rows.reduce((sum, r) => sum + r.misleading, 0)
  const blight = outcomes.filter((o) => o.truth === 'late_blight')
  const caught = blight.filter((o) => o.result.decision !== 'unknown' && o.result.candidates.includes('late_blight')).length
  const unseen = outcomes.filter((o) => o.truth === UNSEEN)
  const flagged = (g: string) => outcomes.filter((o) => o.truth === g && flagOf(o.quality))
  const inGroup = (g: string) => outcomes.filter((o) => o.truth === g).length
  const sizes = new Map<string, number>()
  for (const o of outcomes) sizes.set(o.size, (sizes.get(o.size) ?? 0) + 1)
  const resized = outcomes.filter((o) => o.longSide < PHONE_MIN_SIDE).length
  return [
    '# Field-photo test',
    '',
    '## Photos',
    '',
    ...(about ? [about, ''] : []),
    `${total} photos: ${groups.map((g) => `${g} ${inGroup(g)}`).join(', ')}. ` +
      `Sizes: ${[...sizes].sort((a, b) => b[1] - a[1]).map(([s, n]) => (sizes.size === 1 ? `all ${s}` : `${s} (${n})`)).join(', ')}.`,
    '',
    `The app's photo diagnosis on ${total} labelled photos from \`${dir}\`, one photo at a time, with the real model and the app's own preprocessing and thresholds. ` +
      "Every photo goes to the model, including those the camera would have asked to retake; the camera's check is reported on its own.",
    '',
    '## Headline',
    '',
    '| Measure | Result |',
    '|---|---|',
    // The camera's check stays out of the headline: on resized photos it isn't what a phone would see.
    `| Misleading answers | ${share(misleading, total)} |`,
    ...(blight.length ? [`| Late blight caught (confident, or on the shortlist) | ${share(caught, blight.length)} |`] : []),
    ...(unseen.length ? [`| Unseen diseases called "unknown" | ${share(unseen.filter((o) => o.result.decision === 'unknown').length, unseen.length)} |`] : []),
    '',
    '## Model answers',
    '',
    '| Folder | Photos | Right | Shortlist with the right answer | "Unknown" | Misleading |',
    '|---|--:|--:|--:|--:|--:|',
    ...rows.map((r) => `| ${r.g} | ${r.n} | ${r.right} | ${r.shortlist} | ${r.unknown} | ${r.misleading} |`),
    '',
    `**Misleading: ${share(misleading, total)}**: a confident wrong answer, a shortlist without the real disease, or an unseen disease not called "unknown". ` +
      `For \`${UNSEEN}\`, "right" means the app said "unknown".`,
    '',
    '## Confident answers',
    '',
    `| Truth \\ App | ${diseases.join(' | ')} |`,
    `|---|${diseases.map(() => '--:').join('|')}|`,
    // unseen stays in: a confident disease on an unseen one is a false alarm a farmer would act on.
    ...groups.map((g) => `| ${g} | ${diseases.map((d) => outcomes.filter((o) => o.truth === g && o.result.decision === 'confident' && o.result.candidates[0] === d).length).join(' | ')} |`),
    '',
    `Confident answers that were right: ${share(confident.filter((o) => o.result.candidates[0] === o.truth).length, confident.length)}.`,
    '',
    '## Camera quality check',
    '',
    ...(resized
      ? [`**Not representative: pre-resized, not phone photos.** ${resized === total ? 'Every photo' : `${resized} of ${total} photos`} had its longer side under ${PHONE_MIN_SIDE} px before the check saw it, so these counts say little about a farmer's camera.`, '']
      : []),
    "What the camera's check (`src/lib/imageQuality.ts`) would have said on each photo as a gallery upload: the whole photo scaled to the analysis width. " +
      'A flagged photo can still be kept by the farmer.',
    '',
    '| Folder | Photos | Would ask to retake | Too dark | Too bright | No leaf | Too far | Blurry |',
    '|---|--:|--:|--:|--:|--:|--:|--:|',
    ...groups.map((g) => {
      const f = flagged(g).map((o) => flagOf(o.quality))
      const n = (hint: string) => f.filter((x) => x === hint).length
      return `| ${g} | ${inGroup(g)} | ${share(f.length, inGroup(g))} | ${n('too dark')} | ${n('too bright')} | ${n('no leaf')} | ${n('too far')} | ${n('blurry')} |`
    }),
    '',
    `Generated on ${todayIn()} by \`npx tsx scripts/eval-field-photos.ts <dir>${args} --write\`.`,
    '',
  ].join('\n')
}

async function main() {
  const argv = process.argv.slice(2)
  const cropAt = argv.indexOf('--crop')
  const crop = cropAt >= 0 ? argv[cropAt + 1] : 'potato'
  if (!isCropId(crop)) throw new Error(`--crop must be potato or paddy, not ${crop}`)
  const dir = argv.find((a, i) => !a.startsWith('--') && (cropAt < 0 || i !== cropAt + 1))
  if (!dir) throw new Error('Usage: npx tsx scripts/eval-field-photos.ts <dir> [--crop paddy] [--write]')
  const configUrl = configUrlOf(crop)
  const config = parseConfig(JSON.parse(readFileSync(join('public', configUrl), 'utf8')))
  const known = new Set([...config.diseases, UNSEEN])
  const groups = readdirSync(dir).filter((g) => statSync(join(dir, g)).isDirectory())
  const unknownGroups = groups.filter((g) => !known.has(g))
  if (unknownGroups.length) throw new Error(`Folders must be ${[...known].join(', ')}; not ${unknownGroups.join(', ')}`)

  const [{ default: sharp }, ort] = await Promise.all([import('sharp'), import('onnxruntime-node')])
  const session = await ort.InferenceSession.create(join('public', modelUrl(configUrl, config.modelFile)))
  const outcomes: Outcome[] = []
  for (const truth of groups) {
    for (const file of readdirSync(join(dir, truth)).filter((f) => IMAGE.test(f))) {
      const path = join(dir, truth, file)
      // Phone photos carry their rotation in EXIF; the browser applies it, so do the same here.
      const image = sharp(path).rotate()
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
      const quality = await qualityOfFile(path, leafNearOf(crop))
      const outcome = { file: `${truth}/${file}`, truth, result, quality, size: `${width}×${height}`, longSide: Math.max(width, height) }
      outcomes.push(outcome)
      console.log(`${outcome.file}: ${result.decision} [${result.candidates.join(', ')}] → ${verdict(outcome)}; camera: ${flagOf(quality) ?? 'ok'}`)
    }
  }
  if (outcomes.length === 0) throw new Error(`No photos found under ${dir}`)

  const aboutPath = join(dir, 'ABOUT.md')
  const about = existsSync(aboutPath) ? readFileSync(aboutPath, 'utf8').trim() : ''
  const doc = markdown(outcomes, groups, config.diseases, dir, crop === 'potato' ? '' : ` --crop ${crop}`, about)
  console.log(`\n${doc}`)
  if (argv.includes('--write')) {
    const DOC = crop === 'potato' ? 'docs/field-photo-test.md' : `docs/field-photo-test-${crop}.md`
    writeFileSync(DOC, doc)
    console.log(`Wrote ${DOC}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
