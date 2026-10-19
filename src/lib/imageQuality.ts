// Cheap photo-quality checks on a small RGBA frame (no ML): brightness, blur and leaf presence.

/** Anything shaped like ImageData, so tests can build frames without the DOM. */
export type Pixels = Pick<ImageData, 'data' | 'width' | 'height'>

/** A rectangle as fractions (0–1) of the frame. */
export type Region = { x: number; y: number; w: number; h: number }

// Frames are downscaled to this width before analysis.
export const ANALYSIS_WIDTH = 160

// Mean luma (0–255) outside this range is too dark / too bright.
export const DARK_LUMA = 60
export const BRIGHT_LUMA = 215

// Variance of the Laplacian below this is blurry. Tuned on ANALYSIS_WIDTH frames; logged in dev.
export const BLUR_THRESHOLD = 100

// A pixel is "green" when its Excess Green index 2G − R − B is above this.
export const EXG_GREEN = 20

// Share of green pixels inside LEAF_REGION: below ABSENT there's no leaf, below NEAR it's too far away.
export const LEAF_ABSENT_FRACTION = 0.05
export const LEAF_NEAR_FRACTION = 0.25

// The dashed leaf frame in the viewfinder.
export const LEAF_REGION: Region = { x: 0.1, y: 0.2, w: 0.8, h: 0.7 }

export type QualityReport = {
  luma: number
  sharpness: number
  green: number
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

/** Fraction of pixels inside `region` whose Excess Green index is above EXG_GREEN. */
export function greenFraction({ data, width, height }: Pixels, region: Region = LEAF_REGION): number {
  const x0 = Math.floor(region.x * width)
  const x1 = Math.min(width, Math.ceil((region.x + region.w) * width))
  const y0 = Math.floor(region.y * height)
  const y1 = Math.min(height, Math.ceil((region.y + region.h) * height))
  let green = 0
  let total = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const p = (y * width + x) * 4
      if (2 * data[p + 1] - data[p] - data[p + 2] > EXG_GREEN) green++
      total++
    }
  }
  return total ? green / total : 0
}

export function assessQuality(px: Pixels): QualityReport {
  const gray = toGray(px)
  const luma = meanLuma(gray)
  const sharpness = laplacianVariance(gray, px.width, px.height)
  const green = greenFraction(px)
  return {
    luma,
    sharpness,
    green,
    light: luma < DARK_LUMA ? 'dark' : luma > BRIGHT_LUMA ? 'bright' : 'ok',
    focus: sharpness < BLUR_THRESHOLD ? 'blurry' : 'ok',
    leaf: green < LEAF_ABSENT_FRACTION ? 'absent' : green < LEAF_NEAR_FRACTION ? 'far' : 'ok',
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
