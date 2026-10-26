import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseBacktest, parseEvalSummary, tableRows } from '@/lib/docsData'

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
