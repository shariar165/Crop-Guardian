import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { combine } from '@/lib/diagnosis/combine'
import type { Decision, PhotoResult } from '@/lib/diagnosis/decide'
import { realConfig } from '@/lib/diagnosis/__fixtures__'

const [EARLY, HEALTHY, LATE] = realConfig.diseases

const confident = (id: string, p = 0.95): PhotoResult => {
  const probs = realConfig.diseases.map((d) => (d === id ? p : (1 - p) / 2))
  return { decision: 'confident', candidates: [id], probs, oodScore: 0 }
}
const uncertain = (probs: number[]): PhotoResult => ({
  decision: 'uncertain',
  candidates: realConfig.diseases.filter((_, i) => probs[i] >= 0.3).sort((a, b) => probs[realConfig.diseases.indexOf(b)] - probs[realConfig.diseases.indexOf(a)]),
  probs,
  oodScore: 0,
})
const unknown: PhotoResult = { decision: 'unknown', candidates: [], probs: [0.4, 0.2, 0.4], oodScore: 0 }

const CAUTION: Record<Decision, number> = { confident: 0, uncertain: 1, unknown: 2 }

describe('combine', () => {
  it('is confident when both photos are confident about the same class', () => {
    const r = combine(confident(LATE), confident(LATE, 0.9), realConfig)
    assert.deepEqual([r.decision, r.candidates], ['confident', [LATE]])
  })

  it('is uncertain with both classes when two confident photos disagree, most probable first', () => {
    const r = combine(confident(EARLY, 0.9), confident(LATE, 0.97), realConfig)
    assert.deepEqual([r.decision, r.candidates], ['uncertain', [LATE, EARLY]])
  })

  it('treats healthy like any other class', () => {
    const r = combine(confident(HEALTHY), confident(LATE), realConfig)
    assert.equal(r.decision, 'uncertain')
    assert.deepEqual(new Set(r.candidates), new Set([HEALTHY, LATE]))
  })

  it('is unknown when either photo is unknown', () => {
    for (const other of [confident(LATE), uncertain([0.5, 0.1, 0.4]), unknown]) {
      assert.deepEqual(combine(other, unknown, realConfig).decision, 'unknown')
      assert.deepEqual(combine(unknown, other, realConfig).decision, 'unknown')
      assert.deepEqual(combine(unknown, other, realConfig).candidates, [])
    }
  })

  it('stays uncertain with every class either photo kept', () => {
    const r = combine(confident(HEALTHY, 0.9), uncertain([0.5, 0.1, 0.4]), realConfig)
    assert.equal(r.decision, 'uncertain')
    assert.deepEqual(r.candidates, [HEALTHY, EARLY, LATE])
  })

  it('is never more confident than either photo', () => {
    const photos = [confident(EARLY), confident(LATE), confident(HEALTHY), uncertain([0.5, 0.1, 0.4]), unknown]
    for (const a of photos) {
      for (const b of photos) {
        const r = combine(a, b, realConfig)
        assert.ok(CAUTION[r.decision] >= Math.max(CAUTION[a.decision], CAUTION[b.decision]), `${a.decision}+${b.decision}`)
      }
    }
  })

  it('keeps both photos for display', () => {
    const top = confident(LATE)
    const under = unknown
    assert.deepEqual(combine(top, under, realConfig).photos, { top, under })
  })
})
