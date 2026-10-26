// Numbers for /docs, read from the generated reports in docs/ so the page can never disagree with
// them (each report is rewritten by its script's --write).

// The rows of every Markdown table in `md`, header and divider rows left out, cells trimmed.
export function tableRows(md: string): string[][] {
  const rows: string[][] = []
  let inTable = false
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (!t.startsWith('|')) {
      inTable = false
      continue
    }
    const cells = t.slice(1, t.endsWith('|') ? -1 : undefined).split('|').map((c) => c.trim())
    // The first row of a table is its header, the second its divider.
    if (!inTable) inTable = true
    else if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells)
  }
  return rows
}

export type BacktestRow = { season: string; source: string; appRule: boolean; dangerDays: number; days: number; alerts: number }

// docs/risk-backtest.md's first table: | Winter | Source | Rule | Danger days ("47 of 91") | Alerts | …
export function parseBacktest(md: string): BacktestRow[] {
  return tableRows(md).flatMap(([season, source, rule, danger, alerts]) => {
    const m = danger?.match(/^(\d+) of (\d+)$/)
    if (!m || !/^\d+$/.test(alerts ?? '')) return []
    return [{ season, source, appRule: rule.includes('(app)'), dangerDays: Number(m[1]), days: Number(m[2]), alerts: Number(alerts) }]
  })
}

// docs/assistant-eval.md's summary table: | Check | Result |
export function parseEvalSummary(md: string): { check: string; result: string }[] {
  const summary = md.split('## Summary')[1]?.split('## ')[0] ?? ''
  return tableRows(summary).map(([check, result]) => ({ check, result }))
}
