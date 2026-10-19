import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decide } from '@/lib/diagnosis/decide'
import { logitsFor, PARITY_SKIP, parityFixtures, realConfig, syntheticConfig } from '@/lib/diagnosis/__fixtures__'

const [, HEALTHY, LATE] = realConfig.diseases

describe('decide on the notebook parity fixtures', () => {
  it('makes the same decision and candidates as the notebook', { skip: PARITY_SKIP }, () => {
    for (const f of parityFixtures) {
      const r = decide(f.logits, realConfig)
      assert.equal(r.decision, f.decision, f.image)
      assert.deepEqual(r.candidates, f.candidates, f.image)
      f.probs?.forEach((p, i) => assert.ok(Math.abs(r.probs[i] - p) < 1e-5, `${f.image} probs[${i}]`))
      if (f.ood_score !== undefined) assert.ok(Math.abs(r.oodScore - f.ood_score) < 1e-5, `${f.image} ood_score`)
    }
  })
})

describe('decide with the exported config', () => {
  it('is confident when one class clears the set threshold', () => {
    const r = decide(logitsFor([0.02, 0.03, 0.95], realConfig), realConfig)
    assert.equal(r.decision, 'confident')
    assert.deepEqual(r.candidates, [LATE])
    assert.ok(Math.abs(r.probs[2] - 0.95) < 1e-9)
  })

  it('can be confident that a leaf is healthy', () => {
    const r = decide(logitsFor([0.01, 0.97, 0.02], realConfig), realConfig)
    assert.deepEqual([r.decision, r.candidates], ['confident', [HEALTHY]])
  })

  it('is unknown when no class clears the set threshold', () => {
    const r = decide(logitsFor([0.45, 0.1, 0.45], realConfig), realConfig)
    assert.deepEqual([r.decision, r.candidates], ['unknown', []])
  })

  it('is unknown when the "other" score is over the OOD threshold, even if a class is sure', () => {
    const r = decide(logitsFor([0.01, 0.01, 0.98], realConfig, 50), realConfig)
    assert.ok(r.oodScore > realConfig.ood.threshold)
    assert.deepEqual([r.decision, r.candidates], ['unknown', []])
  })

  it('computes p_other over all logits at T = 1', () => {
    const logits = [1, 2, 3, 4]
    const expected = Math.exp(4) / logits.reduce((s, x) => s + Math.exp(x), 0)
    assert.ok(Math.abs(decide(logits, realConfig).oodScore - expected) < 1e-12)
  })

  it('never decides "uncertain" for one photo, since 1 − qhat is above 0.5, and never names "other"', () => {
    assert.ok(1 - realConfig.qhat > 0.5)
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 20 - 10
    for (let i = 0; i < 5000; i++) {
      const r = decide([rand(), rand(), rand(), rand()], realConfig)
      assert.notEqual(r.decision, 'uncertain')
      for (const id of r.candidates) assert.ok(realConfig.diseases.includes(id), id)
    }
  })

  it('rejects logits of the wrong length', () => {
    assert.throws(() => decide([1, 2, 3], realConfig), /Expected 4 logits/)
  })
})

describe('decide with a synthetic config', () => {
  it('includes a class whose probability is exactly 1 − qhat', () => {
    const r = decide([0, -Infinity, -20], syntheticConfig({ qhat: 0 }))
    assert.equal(r.probs[0], 1)
    assert.deepEqual([r.decision, r.candidates], ['confident', ['a']])
  })

  it('is "uncertain" when several classes clear the threshold, most probable first', () => {
    const config = syntheticConfig({ qhat: 0.65 })
    const r = decide(logitsFor([0.4, 0.6], config), config)
    assert.deepEqual([r.decision, r.candidates], ['uncertain', ['b', 'a']])
  })

  it('applies the temperature to the disease logits only', () => {
    const config = syntheticConfig({ temperature: 2 })
    const r = decide([2, 0, 0], config)
    const e = Math.exp(1)
    assert.ok(Math.abs(r.probs[0] - e / (e + 1)) < 1e-12)
  })

  it('uses the energy score when configured', () => {
    const config = syntheticConfig({ temperature: 2, qhat: 0.6, ood: { method: 'energy', threshold: -1 } })
    const r = decide([2, 2, 0], config)
    assert.ok(Math.abs(r.oodScore - -2 * Math.log(2 * Math.exp(1))) < 1e-12)
    assert.equal(r.decision, 'uncertain')
    assert.equal(decide([-4, -4, 0], config).decision, 'unknown')
  })

  it('uses the max-probability score when configured', () => {
    const config = syntheticConfig({ qhat: 0.5, ood: { method: 'msp', threshold: -0.58 } })
    const sure = decide(logitsFor([0.6, 0.4], config), config)
    assert.ok(Math.abs(sure.oodScore - -0.6) < 1e-12)
    assert.equal(sure.decision, 'confident')
    // -0.55 is above the threshold: too unsure, even though "a" clears 1 − qhat.
    assert.equal(decide(logitsFor([0.55, 0.45], config), config).decision, 'unknown')
  })
})
