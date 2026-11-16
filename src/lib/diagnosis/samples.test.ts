import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { PHOTO_CROPS } from './crops'
import { SAMPLE_LEAVES, SAMPLE_NOTE, sampleById } from './samples'

const PARITY = join('src', 'lib', 'diagnosis', '__fixtures__', 'parity')
type Expected = { file: string; group: string; decision: string; candidates: string[] }
const expected: Expected[] = JSON.parse(readFileSync(join(PARITY, 'expected.json'), 'utf8'))

// The samples are the parity images byte for byte, so parity.test.ts already checks that the app's
// model gives the notebook's decision on each, and this checks the decision is the one the button implies.
test('every sample is a parity image the notebook decided as its label says', () => {
  assert.ok(SAMPLE_LEAVES.length >= 3)
  assert.equal(new Set(SAMPLE_LEAVES.map((s) => s.id)).size, SAMPLE_LEAVES.length)
  for (const s of SAMPLE_LEAVES) {
    assert.ok(PHOTO_CROPS.includes(s.crop), s.id)
    assert.ok(readFileSync(join('public', s.src)).equals(readFileSync(join(PARITY, s.fixture))), s.id)
    const e = expected.find((x) => x.file === s.fixture)
    assert.ok(e, s.id)
    if (e.group === 'unseen_disease') assert.equal(e.decision, 'unknown', s.id)
    else assert.deepEqual([e.decision, e.candidates], ['confident', [e.group]], s.id)
  }
  const groups = new Set(SAMPLE_LEAVES.map((s) => expected.find((x) => x.file === s.fixture)?.group))
  for (const g of ['healthy', 'late_blight', 'unseen_disease']) assert.ok(groups.has(g), g)
})

test('a sample result is labelled, and an unknown id is not a sample', () => {
  assert.match(SAMPLE_NOTE, /sample image from the test set/)
  assert.equal(sampleById(undefined), undefined)
  assert.equal(sampleById('nope'), undefined)
})
