// Runs the real model in Node on the notebook's parity images and checks the app reaches the same
// decisions. Resizing differs slightly from the notebook's, so logit drift is reported, not asserted.
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { decide } from '@/lib/diagnosis/decide'
import { resizeGeometry, toTensor } from '@/lib/diagnosis/preprocess'
import { PARITY_DIR, PARITY_SKIP, parityFixtures, realConfig } from '@/lib/diagnosis/__fixtures__'

describe('the model on the parity images', () => {
  it('gives the notebook decision for every image', { skip: PARITY_SKIP, timeout: 120_000 }, async (t) => {
    const [{ default: sharp }, ort] = await Promise.all([import('sharp'), import('onnxruntime-node')])
    const session = await ort.InferenceSession.create(join(process.cwd(), 'public', 'model', realConfig.modelFile))

    for (const f of parityFixtures) {
      const image = sharp(join(PARITY_DIR, f.image))
      const { width = 0, height = 0 } = await image.metadata()
      const g = resizeGeometry(width, height, realConfig)
      const { data } = await image
        .resize(g.width, g.height, { fit: 'fill', kernel: 'linear' })
        .extract({ left: g.left, top: g.top, width: g.size, height: g.size })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const input = new ort.Tensor('float32', toTensor(data, g.size, realConfig), [1, 3, g.size, g.size])
      const output = await session.run({ [realConfig.inputName]: input })
      const logits = Array.from(output[realConfig.outputName].data as Float32Array)

      const drift = Math.max(...logits.map((x, i) => Math.abs(x - f.logits[i])))
      t.diagnostic(`${f.image}: max logit drift ${drift.toFixed(4)}`)
      const r = decide(logits, realConfig)
      assert.equal(r.decision, f.decision, f.image)
      assert.deepEqual(r.candidates, f.candidates, f.image)
    }
  })
})
