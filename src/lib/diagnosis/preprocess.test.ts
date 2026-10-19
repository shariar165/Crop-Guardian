import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resizeGeometry, toTensor } from '@/lib/diagnosis/preprocess'
import { realConfig } from '@/lib/diagnosis/__fixtures__'

const { resizeShorterSide: SHORT, centerCrop: CROP, mean, std, scale } = realConfig.preprocess

describe('resizeGeometry', () => {
  it('resizes a portrait photo by its width and truncates the height', () => {
    // 1024 × 1365 → 255 × trunc(255 * 1365 / 1024) = 255 × 339
    assert.deepEqual(resizeGeometry(1024, 1365, realConfig), { width: SHORT, height: 339, left: 16, top: 58, size: CROP })
  })

  it('resizes a landscape photo by its height', () => {
    assert.deepEqual(resizeGeometry(4000, 3000, realConfig), { width: 340, height: SHORT, left: 58, top: 16, size: CROP })
  })

  it('crops a square photo in the middle', () => {
    assert.deepEqual(resizeGeometry(256, 256, realConfig), { width: SHORT, height: SHORT, left: 16, top: 16, size: CROP })
  })

  it("rounds a half-pixel crop offset to even, like Python's round()", () => {
    // 255 - 224 = 31 → 15.5 → 16; with a 253-wide resize, 29 / 2 = 14.5 → 14.
    const config = { ...realConfig, preprocess: { ...realConfig.preprocess, resizeShorterSide: 253 } }
    assert.equal(resizeGeometry(253, 253, config).left, 14)
    assert.equal(resizeGeometry(255, 255, realConfig).left, 16)
  })
})

describe('toTensor', () => {
  it('normalises each channel with the config mean and std', () => {
    const rgba = new Uint8ClampedArray(CROP * CROP * 4)
    for (let i = 0; i < CROP * CROP; i++) rgba.set([255, 128, 0, 255], i * 4)
    const t = toTensor(rgba, CROP, realConfig)
    assert.equal(t.length, 3 * CROP * CROP)
    const expected = [255, 128, 0].map((v, c) => Math.fround((v * scale - mean[c]) / std[c]))
    for (let c = 0; c < 3; c++) {
      assert.ok(Math.abs(t[c * CROP * CROP] - expected[c]) < 1e-6, `channel ${c}`)
      assert.ok(Math.abs(t[(c + 1) * CROP * CROP - 1] - expected[c]) < 1e-6, `channel ${c} end`)
    }
  })

  it('lays the channels out one plane after another (NCHW)', () => {
    const size = 2
    const config = { ...realConfig, preprocess: { ...realConfig.preprocess, scale: 1, mean: [0, 0, 0] as [number, number, number], std: [1, 1, 1] as [number, number, number] } }
    // Pixels: (r, g, b) = (10i, 10i + 1, 10i + 2); alpha is ignored.
    const rgba = [0, 1, 2, 9, 10, 11, 12, 9, 20, 21, 22, 9, 30, 31, 32, 9]
    assert.deepEqual([...toTensor(rgba, size, config)], [0, 10, 20, 30, 1, 11, 21, 31, 2, 12, 22, 32])
  })

  it('rejects a buffer of the wrong size', () => {
    assert.throws(() => toTensor(new Uint8ClampedArray(10), CROP, realConfig), /RGBA values/)
  })
})
