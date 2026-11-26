// Cheap photo-quality checks on a small RGBA frame (no ML): brightness, blur and leaf presence.

/** Anything shaped like ImageData, so tests can build frames without the DOM. */
export type Pixels = Pick<ImageData, 'data' | 'width' | 'height'>

/** A rectangle as fractions (0–1) of the frame. */
export type Region = { x: number; y: number; w: number; h: number }

// Frames are downscaled to this width before analysis.
export const ANALYSIS_WIDTH = 160

// Mean luma (0–255) below DARK_LUMA is too dark. It is measured on the leaf's own pixels, so a
// well-lit leaf on a bright background isn't called bright, nor a dark leaf on one called fine.
// With no leaf to measure, the whole frame is judged, against both DARK_LUMA and BRIGHT_LUMA.
export const DARK_LUMA = 60
export const BRIGHT_LUMA = 215

// With a leaf in frame, "too bright" is glare: the share of blown-out pixels (luma above
// BLOWN_LUMA) inside LEAF_REGION, which catches a shine on a wet leaf that mean luma misses.
// 0.30 lets every parity image through: 23 of 24 have under 1%, but a paddy photo on a white
// background has 23% (the phone test may tighten this).
export const BLOWN_LUMA = 250
export const BRIGHT_BLOWN_FRACTION = 0.3

// Variance of the Laplacian below this is blurry. Tuned on ANALYSIS_WIDTH frames; logged in dev.
export const BLUR_THRESHOLD = 100

// A pixel is "green" when its Excess Green index 2G − R − B is above this.
export const EXG_GREEN = 20

// Share of green pixels inside LEAF_REGION: below ABSENT there's no leaf, below NEAR it's too far away.
// NEAR is the default; a crop can set its own (a paddy leaf is narrow, see diagnosis/crops.ts).
export const LEAF_ABSENT_FRACTION = 0.05
export const LEAF_NEAR_FRACTION = 0.25

// The dashed leaf frame in the viewfinder.
export const LEAF_REGION: Region = { x: 0.1, y: 0.2, w: 0.8, h: 0.7 }

export type QualityReport = {
  // Mean luma of the leaf's pixels, or of the whole frame when there's no leaf.
  luma: number
  sharpness: number
  green: number
  // Share of blown-out pixels inside LEAF_REGION (missing in reports saved before it existed).
  blown?: number
  light: 'ok' | 'dark' | 'bright'
  focus: 'ok' | 'blurry'
  leaf: 'ok' | 'far' | 'absent'
}

export function toGray({ data, width, height }: Pixels): Float32Array {
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
  }
  return gray
}

export function meanLuma(gray: Float32Array): number {
  let sum = 0
  for (const v of gray) sum += v
  return gray.length ? sum / gray.length : 0
}

/** Variance of the 4-neighbour Laplacian over interior pixels: low means few edges, i.e. blur. */
export function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (!n) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

type RegionStats = { green: number; leafLuma: number; blown: number }

// One pass over `region`: the green share, the mean luma of the green pixels, and the blown-out share.
function regionStats({ data, width, height }: Pixels, region: Region): RegionStats {
  const x0 = Math.floor(region.x * width)
  const x1 = Math.min(width, Math.ceil((region.x + region.w) * width))
  const y0 = Math.floor(region.y * height)
  const y1 = Math.min(height, Math.ceil((region.y + region.h) * height))
  let green = 0
  let greenLuma = 0
  let blown = 0
  let total = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const p = (y * width + x) * 4
      const luma = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
      if (2 * data[p + 1] - data[p] - data[p + 2] > EXG_GREEN) {
        green++
        greenLuma += luma
      }
      if (luma > BLOWN_LUMA) blown++
      total++
    }
  }
  return total ? { green: green / total, leafLuma: green ? greenLuma / green : 0, blown: blown / total } : { green: 0, leafLuma: 0, blown: 0 }
}

/** Fraction of pixels inside `region` whose Excess Green index is above EXG_GREEN. */
export function greenFraction(px: Pixels, region: Region = LEAF_REGION): number {
  return regionStats(px, region).green
}

/** `leafNear`: the crop's green share below which the leaf is too far (LEAF_NEAR_FRACTION by default). */
export function assessQuality(px: Pixels, { leafNear = LEAF_NEAR_FRACTION }: { leafNear?: number } = {}): QualityReport {
  const gray = toGray(px)
  const sharpness = laplacianVariance(gray, px.width, px.height)
  const { green, leafLuma, blown } = regionStats(px, LEAF_REGION)
  // Too little green to measure the leaf by (the same line as "no leaf"): judge the whole frame.
  const hasLeaf = green >= LEAF_ABSENT_FRACTION
  const luma = hasLeaf ? leafLuma : meanLuma(gray)
  const bright = blown > BRIGHT_BLOWN_FRACTION || (!hasLeaf && luma > BRIGHT_LUMA)
  return {
    luma,
    sharpness,
    green,
    blown,
    light: luma < DARK_LUMA ? 'dark' : bright ? 'bright' : 'ok',
    focus: sharpness < BLUR_THRESHOLD ? 'blurry' : 'ok',
    leaf: green < LEAF_ABSENT_FRACTION ? 'absent' : green < leafNear ? 'far' : 'ok',
  }
}

export function isAcceptable(r: QualityReport): boolean {
  return r.light === 'ok' && r.focus === 'ok' && r.leaf === 'ok'
}

/**
 * The single most important thing to fix. Light comes first, since blur and
 * green can't be judged reliably in a dark or washed-out frame.
 */
export function topHint(r: QualityReport): string | null {
  if (r.light === 'dark') return 'আলো কম'
  if (r.light === 'bright') return 'আলো খুব বেশি'
  if (r.leaf === 'absent') return 'পাতা ফ্রেমের ভেতরে আনুন'
  if (r.leaf === 'far') return 'আরো কাছে আনুন'
  if (r.focus === 'blurry') return 'ফোন স্থির রাখুন'
  return null
}

/** The "keep it anyway?" question for a photo that failed the checks, e.g. "ছবি ঝাপসা/অন্ধকার — তবুও রাখবেন?". */
export function confirmText(r: QualityReport): string {
  const faults = [
    r.focus === 'blurry' && 'ঝাপসা',
    r.light === 'dark' && 'অন্ধকার',
    r.light === 'bright' && 'খুব উজ্জ্বল',
  ].filter(Boolean)
  // Leaf presence isn't meaningful when the light is bad.
  const leaf = r.light !== 'ok' ? null : r.leaf === 'absent' ? 'পাতা দেখা যাচ্ছে না' : r.leaf === 'far' ? 'পাতা অনেক ছোট' : null
  const parts = [faults.length ? `ছবি ${faults.join('/')}` : null, leaf].filter(Boolean)
  return `${parts.join(', ')} — তবুও রাখবেন?`
}

/** The part of a srcW×srcH image that `object-fit: cover` shows in a boxW×boxH box. */
export function coverSourceRect(srcW: number, srcH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / srcW, boxH / srcH)
  const sw = boxW / scale
  const sh = boxH / scale
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh }
}
