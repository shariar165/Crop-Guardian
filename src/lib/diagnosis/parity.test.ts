// Runs each crop's real model in Node on the notebook's parity images and checks the app reaches the
// same decisions. Resizing differs slightly from the notebook's, so logit drift is reported, not asserted.
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { CROP_IDS } from '@/lib/crops'
import { decide } from '@/lib/diagnosis/decide'
import { resizeGeometry, toTensor } from '@/lib/diagnosis/preprocess'
import { configOf, modelPathOf, parityDirOf, parityFixturesOf } from '@/lib/diagnosis/__fixtures__'

for (const crop of CROP_IDS) {
  const config = configOf(crop)
  const fixtures = parityFixturesOf(crop)
  const skip = !config
    ? `no ${crop} model exported yet`
    : fixtures.length === 0
      ? `${crop} parity fixtures not exported yet (see __fixtures__/README in its parity folder)`
      : false

  describe(`the ${crop} model on the parity images`, () => {
    it('gives the notebook decision for every image', { skip, timeout: 120_000 }, async (t) => {
      const [{ default: sharp }, ort] = await Promise.all([import('sharp'), import('onnxruntime-node')])
      const session = await ort.InferenceSession.create(modelPathOf(crop, config!))

      for (const f of fixtures) {
        const image = sharp(join(parityDirOf(crop), f.file))
        const { width = 0, height = 0 } = await image.metadata()
        const g = resizeGeometry(width, height, config!)
        const { data } = await image
          .resize(g.width, g.height, { fit: 'fill', kernel: 'linear' })
          .extract({ left: g.left, top: g.top, width: g.size, height: g.size })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })

        const input = new ort.Tensor('float32', toTensor(data, g.size, config!), [1, 3, g.size, g.size])
        const output = await session.run({ [config!.inputName]: input })
        const logits = Array.from(output[config!.outputName].data as Float32Array)

        const drift = Math.max(...logits.map((x, i) => Math.abs(x - f.logits[i])))
        t.diagnostic(`${f.file}: max logit drift ${drift.toFixed(4)}`)
        const r = decide(logits, config!)
        assert.equal(r.decision, f.decision, f.file)
        assert.deepEqual(r.candidates, f.candidates, f.file)
      }
    })
  })
}
