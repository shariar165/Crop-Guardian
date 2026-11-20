import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { parseBacktest, parseEvalSummary, parseFieldPhotoAbout, parseFieldPhotoHeadline, parseFindings, parseLeaveOneOut, tableRows } from '@/lib/docsData'

test('table rows skip the header and divider of each table', () => {
  const md = '| A | B |\n|---|--:|\n| 1 | 2 |\n\ntext\n\n| C |\n|---|\n| 3 |'
  assert.deepEqual(tableRows(md), [['1', '2'], ['3']])
})

test('the real late-blight backtest parses into rows for both sources', () => {
  const rows = parseBacktest(readFileSync('docs/risk-backtest.md', 'utf8'))
  assert.ok(rows.length >= 6)
  const app = rows.filter((r) => r.appRule)
  assert.ok(app.some((r) => r.source.includes('Open-Meteo')) && app.some((r) => r.source.includes('NASA')))
  for (const r of rows) assert.ok(r.dangerDays <= r.days && r.alerts <= r.dangerDays, r.season)
})

test('the eval summary is read from its section only', () => {
  const md = '# Eval\n\n## Summary\n\n| Check | Result |\n|---|---|\n| No dose | 34/34 |\n\n## Every answer\n\n| Case | Q |\n|---|---|\n| x | y |'
  assert.deepEqual(parseEvalSummary(md), [{ check: 'No dose', result: '34/34' }])
  assert.deepEqual(parseEvalSummary('nothing'), [])
})

test('the rule comparison findings are the bold leads of its first section', () => {
  const md = '# R\n\n## What this shows\n\n- **First finding.** More text.\n- **Second.** Text.\n\nIntro.\n\n## The rules\n\n- **Not a finding**: x'
  assert.deepEqual(parseFindings(md), ['First finding.', 'Second.'])
  const real = parseFindings(readFileSync('docs/rule-comparison.md', 'utf8'))
  assert.ok(real.length >= 3)
  assert.ok(real.some((f) => f.includes('JHULSACAST')))
})

test('the paddy leave-one-dataset-out table parses every held-out dataset', () => {
  const rows = parseLeaveOneOut(readFileSync('docs/model-card-paddy.md', 'utf8'))
  assert.deepEqual(rows.map((r) => r.dataset), ['Dhan-Shomadhan', 'RiceLeafBD', 'RiceLeafDisease-BD5'])
  for (const r of rows) assert.match(`${r.accuracy} ${r.misleading} ${r.unknown}`, /^[\d.]+% [\d.]+% [\d.]+%$/)
  assert.deepEqual(parseLeaveOneOut('nothing'), [])
})

test('the field-photo headline is read from its section only', () => {
  const md = '# Field-photo test\n\n## Headline\n\n| Measure | Result |\n|---|---|\n| Misleading answers | 3 of 30 (10%) |\n\n## Model answers\n\n| Folder | Photos |\n|---|--:|\n| healthy | 10 |'
  assert.deepEqual(parseFieldPhotoHeadline(md), [{ measure: 'Misleading answers', result: '3 of 30 (10%)' }])
  assert.deepEqual(parseFieldPhotoHeadline(''), [])
})

test('the field-photo source is the first paragraph of its Photos section, as plain text', () => {
  const md = '# Field-photo test\n\n## Photos\n\n**30 photos from one station**, from [Some dataset](https://example.org), all\n`224×224`.\n\nOnly `orig_*` files.\n\n## Headline\n'
  assert.equal(parseFieldPhotoAbout(md), '30 photos from one station, from Some dataset, all 224×224.')
  assert.equal(parseFieldPhotoAbout(''), '')
})

test('the committed field-photo report keeps the camera check out of its headline', () => {
  const md = readFileSync(join('docs', 'field-photo-test.md'), 'utf8')
  assert.ok(parseFieldPhotoHeadline(md).length > 0)
  assert.ok(parseFieldPhotoHeadline(md).every((r) => !/camera/i.test(r.measure)))
  assert.match(parseFieldPhotoAbout(md), /224×224/)
  // Under 10 photos a percentage looks surer than it is.
  for (const m of md.matchAll(/(\d+) of (\d+)( \(\d+%\))?/g)) if (Number(m[2]) < 10) assert.equal(m[3], undefined, m[0])
})
