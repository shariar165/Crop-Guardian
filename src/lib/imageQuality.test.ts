import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BLUR_THRESHOLD,
  LEAF_REGION,
  assessQuality,
  confirmText,
  coverSourceRect,
  greenFraction,
  isAcceptable,
  laplacianVariance,
  meanLuma,
  toGray,
  topHint,
} from '@/lib/imageQuality'
import type { Pixels, QualityReport } from '@/lib/imageQuality'
import { leafNearOf } from '@/lib/diagnosis/crops'

const SIZE = 40

type RGB = [number, number, number]

// A SIZE×SIZE frame where each pixel's colour comes from `paint(x, y)`.
function frame(paint: (x: number, y: number) => RGB): Pixels {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = (y * SIZE + x) * 4
      ;[data[p], data[p + 1], data[p + 2]] = paint(x, y)
      data[p + 3] = 255
    }
  }
  return { data, width: SIZE, height: SIZE }
}

const flat = (v: number) => frame(() => [v, v, v])
// Sharp grey texture: alternating 1-px black and white squares.
const checker = (lo = 60, hi = 200) => frame((x, y) => ((x + y) % 2 ? [hi, hi, hi] : [lo, lo, lo]))
// Leaf green over a checkerboard, inside the given fraction of LEAF_REGION (centred).
function greenPatch(scale: number): Pixels {
  const cx = (LEAF_REGION.x + LEAF_REGION.w / 2) * SIZE
  const cy = (LEAF_REGION.y + LEAF_REGION.h / 2) * SIZE
  const hw = (LEAF_REGION.w * SIZE * scale) / 2
  const hh = (LEAF_REGION.h * SIZE * scale) / 2
  return frame((x, y) => {
    const shade = (x + y) % 2 ? 40 : 0
    if (Math.abs(x + 0.5 - cx) < hw && Math.abs(y + 0.5 - cy) < hh) return [70 + shade, 140 + shade, 50 + shade]
    return [120 + shade, 110 + shade, 100 + shade]
  })
}

// greenPatch with some of its leaf pixels repainted by `spot` (null keeps the leaf).
function spotted(scale: number, spot: (x: number, y: number) => RGB | null): Pixels {
  const base = greenPatch(scale)
  const px = frame((x, y) => {
    const p = (y * SIZE + x) * 4
    return [base.data[p], base.data[p + 1], base.data[p + 2]]
  })
  const leaf = greenPatch(scale)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = (y * SIZE + x) * 4
      const isLeaf = 2 * leaf.data[p + 1] - leaf.data[p] - leaf.data[p + 2] > 20
      const c = isLeaf ? spot(x, y) : null
      if (c) [px.data[p], px.data[p + 1], px.data[p + 2]] = c
    }
  }
  return px
}

const OK: QualityReport = { luma: 120, sharpness: 500, green: 0.5, light: 'ok', focus: 'ok', leaf: 'ok' }

describe('brightness', () => {
  it('uses Rec. 601 luma', () => {
    const gray = toGray(frame(() => [255, 0, 0]))
    assert.ok(Math.abs(meanLuma(gray) - 0.299 * 255) < 0.01)
  })

  it('flags dark and bright frames', () => {
    assert.equal(assessQuality(flat(20)).light, 'dark')
    assert.equal(assessQuality(flat(240)).light, 'bright')
    assert.equal(assessQuality(checker()).light, 'ok')
  })
})

describe('light on the leaf', () => {
  it('calls a dark leaf dark, even on a bright background', () => {
    const shade = (x: number, y: number) => ((x + y) % 2 ? 20 : 0)
    const px = frame((x, y) => {
      const inLeaf = x >= 8 && x < 32 && y >= 12 && y < 34
      return inLeaf ? [10 + shade(x, y), 50 + shade(x, y), 10 + shade(x, y)] : [235, 235, 235]
    })
    assert.ok(meanLuma(toGray(px)) > 100)
    assert.equal(assessQuality(px).light, 'dark')
  })

  it('passes a well-lit leaf on a white background', () => {
    // Like the paddy parity photo shot on white paper: little of the leaf frame is blown out.
    const px = frame((x, y) => {
      const shade = (x + y) % 2 ? 40 : 0
      const inLeaf = x >= 6 && x < 34 && y >= 9 && y < 37
      return inLeaf ? [70 + shade, 140 + shade, 50 + shade] : [252, 252, 252]
    })
    const r = assessQuality(px)
    assert.ok(r.blown! > 0 && r.blown! < 0.3, String(r.blown))
    assert.equal(r.light, 'ok')
  })

  it('calls glare on the leaf too bright', () => {
    const px = spotted(1, (x) => (x % 5 < 2 ? [255, 255, 255] : null))
    const r = assessQuality(px)
    assert.equal(r.leaf, 'ok')
    assert.equal(r.light, 'bright')
    assert.equal(topHint(r), 'আলো খুব বেশি')
  })

  it('judges the whole frame when there is no leaf', () => {
    assert.equal(assessQuality(flat(20)).luma, 20)
    assert.equal(assessQuality(flat(240)).light, 'bright')
  })
})

describe('blur', () => {
  it('gives zero Laplacian variance for a flat frame', () => {
    const px = flat(128)
    assert.equal(laplacianVariance(toGray(px), px.width, px.height), 0)
    assert.equal(assessQuality(px).focus, 'blurry')
  })

  it('passes a sharp checkerboard', () => {
    const px = checker()
    assert.ok(laplacianVariance(toGray(px), px.width, px.height) > BLUR_THRESHOLD)
    assert.equal(assessQuality(px).focus, 'ok')
  })

  it('treats a smooth gradient as blurry', () => {
    const px = frame((x) => [60 + x * 3, 60 + x * 3, 60 + x * 3])
    assert.equal(assessQuality(px).focus, 'blurry')
  })
})

describe('leaf presence', () => {
  it('finds a leaf filling the frame', () => {
    const r = assessQuality(greenPatch(1))
    assert.ok(r.green > 0.95)
    assert.equal(r.leaf, 'ok')
  })

  it('says "too far" for a small leaf', () => {
    const r = assessQuality(greenPatch(0.35))
    assert.equal(r.leaf, 'far')
  })

  it('says "absent" with no green', () => {
    assert.equal(assessQuality(checker()).leaf, 'absent')
    assert.equal(greenFraction(flat(128)), 0)
  })

  it('still finds no leaf in a photo of soil', () => {
    const soil = frame((x, y) => {
      const shade = (x + y) % 2 ? 40 : 0
      return [120 + shade, 90 + shade, 60 + shade]
    })
    for (const leafNear of [undefined, leafNearOf('paddy')]) {
      const r = assessQuality(soil, { leafNear })
      assert.equal(r.leaf, 'absent')
      assert.equal(topHint(r), 'পাতা ফ্রেমের ভেতরে আনুন')
    }
  })

  it('passes a leaf with brown lesions', () => {
    // A third of the leaf is brown spots, which aren't green, so they lower the green share.
    const r = assessQuality(spotted(1, (x, y) => (x % 5 < 3 && y % 5 < 3 ? [130, 90, 50] : null)))
    assert.ok(r.green < 0.8, String(r.green))
    assert.ok(isAcceptable(r), JSON.stringify(r))
  })

  it('lets a crop set its own "too far" line', () => {
    // A rice blade close up fills only a tenth of the frame.
    const px = greenPatch(0.35)
    assert.equal(assessQuality(px).leaf, 'far')
    assert.equal(assessQuality(px, { leafNear: leafNearOf('potato') }).leaf, 'far')
    assert.equal(assessQuality(px, { leafNear: leafNearOf('paddy') }).leaf, 'ok')
  })

  it('only counts the given region', () => {
    const left = frame((x) => (x < SIZE / 2 ? [60, 160, 60] : [120, 120, 120]))
    assert.equal(greenFraction(left, { x: 0, y: 0, w: 0.5, h: 1 }), 1)
    assert.equal(greenFraction(left, { x: 0.5, y: 0, w: 0.5, h: 1 }), 0)
  })
})

describe('topHint', () => {
  it('is null when everything passes', () => {
    assert.equal(topHint(OK), null)
    assert.ok(isAcceptable(OK))
  })

  it('puts light before leaf before focus', () => {
    assert.equal(topHint({ ...OK, light: 'dark', focus: 'blurry', leaf: 'absent' }), 'আলো কম')
    assert.equal(topHint({ ...OK, light: 'bright' }), 'আলো খুব বেশি')
    assert.equal(topHint({ ...OK, leaf: 'absent', focus: 'blurry' }), 'পাতা ফ্রেমের ভেতরে আনুন')
    assert.equal(topHint({ ...OK, leaf: 'far', focus: 'blurry' }), 'আরো কাছে আনুন')
    assert.equal(topHint({ ...OK, focus: 'blurry' }), 'ফোন স্থির রাখুন')
  })

  it('agrees with assessQuality on real frames', () => {
    assert.equal(topHint(assessQuality(flat(20))), 'আলো কম')
    assert.equal(topHint(assessQuality(greenPatch(1))), null)
  })
})

describe('confirmText', () => {
  it('names each failing check', () => {
    assert.equal(confirmText({ ...OK, light: 'dark', focus: 'blurry', leaf: 'absent' }), 'ছবি ঝাপসা/অন্ধকার — তবুও রাখবেন?')
    assert.equal(confirmText({ ...OK, focus: 'blurry' }), 'ছবি ঝাপসা — তবুও রাখবেন?')
    assert.equal(confirmText({ ...OK, leaf: 'far' }), 'পাতা অনেক ছোট — তবুও রাখবেন?')
    assert.equal(confirmText({ ...OK, focus: 'blurry', leaf: 'absent' }), 'ছবি ঝাপসা, পাতা দেখা যাচ্ছে না — তবুও রাখবেন?')
  })
})

describe('coverSourceRect', () => {
  it('crops the sides of a landscape source in a portrait box', () => {
    assert.deepEqual(coverSourceRect(1920, 1080, 360, 540), { sx: 600, sy: 0, sw: 720, sh: 1080 })
  })

  it('crops top and bottom of a tall source', () => {
    assert.deepEqual(coverSourceRect(1000, 3000, 100, 200), { sx: 0, sy: 500, sw: 1000, sh: 2000 })
  })
})
