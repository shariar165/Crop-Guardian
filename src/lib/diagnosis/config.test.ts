import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseConfig } from '@/lib/diagnosis/config'
import { rawConfig, realConfig } from '@/lib/diagnosis/__fixtures__'

describe('parseConfig', () => {
  it('reads the exported config', () => {
    const raw = rawConfig()
    assert.deepEqual(realConfig.classes, raw.classes)
    assert.deepEqual(realConfig.diseases, (raw.classes as string[]).slice(0, -1))
    assert.equal(realConfig.temperature, raw.temperature)
    assert.equal(realConfig.qhat, raw.conformal_qhat)
    assert.deepEqual(realConfig.ood, raw.ood)
    assert.equal(realConfig.modelFile, raw.model_file)
    for (const id of realConfig.classes) assert.ok(realConfig.labelsBn[id], id)
  })

  const broken: [string, (c: Record<string, unknown>) => void][] = [
    ['missing classes', (c) => delete c.classes],
    ['duplicate classes', (c) => (c.classes = ['a', 'a'])],
    ['a class without a Bengali label', (c) => (c.labels_bn = {})],
    ['an unknown OOD method', (c) => (c.ood = { method: 'knn', threshold: 0 })],
    ['a non-numeric threshold', (c) => (c.ood = { method: 'p_other', threshold: '0.9' })],
    ['a zero temperature', (c) => (c.temperature = 0)],
    ['qhat outside 0–1', (c) => (c.conformal_qhat = 1.5)],
    ['mean with 2 values', (c) => ((c.preprocess as Record<string, unknown>).mean = [0.5, 0.5])],
    ['NHWC layout', (c) => ((c.preprocess as Record<string, unknown>).layout = 'NHWC')],
    ['a crop larger than the resize', (c) => ((c.preprocess as Record<string, unknown>).center_crop = 300)],
  ]
  for (const [name, breakIt] of broken) {
    it(`rejects ${name}`, () => {
      const c = rawConfig()
      breakIt(c)
      assert.throws(() => parseConfig(c), /Invalid diagnosis config/)
    })
  }
})
