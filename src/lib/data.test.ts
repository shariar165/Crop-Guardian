import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RISK_VIEW, RISKS } from './data'

// The rule isn't validated, so no day may suggest a spray isn't needed, in words or in a picture:
// only danger shows the spray bottle, and nothing shows it crossed out.
test('only a danger day shows the spray icon', () => {
  for (const r of RISKS) assert.equal(RISK_VIEW[r].icon, r === 'danger' ? 'spray' : 'sprout', r)
})
