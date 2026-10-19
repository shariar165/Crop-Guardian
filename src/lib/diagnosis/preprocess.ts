// The model's input from a photo, exactly as `preprocess` in the exported config (torchvision's
// Resize(shorter side) + CenterCrop + Normalize): resize, centre crop, scale, mean/std, NCHW float32.
import type { DiagnosisConfig } from './config'

export type Geometry = {
  // Size after resizing so the shorter side is `resizeShorterSide`.
  width: number
  height: number
  // Top-left corner and side of the square centre crop, in the resized image.
  left: number
  top: number
  size: number
}

// Python's round(): halves go to the even neighbour.
function roundHalfEven(x: number): number {
  const r = Math.round(x)
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r
}

// Same integer arithmetic as torchvision: the long side is truncated, crop offsets use round().
export function resizeGeometry(width: number, height: number, config: DiagnosisConfig): Geometry {
  const { resizeShorterSide: short, centerCrop: size } = config.preprocess
  const [w, h] =
    width <= height ? [short, Math.trunc((short * height) / width)] : [Math.trunc((short * width) / height), short]
  return { width: w, height: h, left: roundHalfEven((w - size) / 2), top: roundHalfEven((h - size) / 2), size }
}

// RGBA pixels of the size × size crop → [1, 3, size, size] float32, channel-major.
export function toTensor(rgba: ArrayLike<number>, size: number, config: DiagnosisConfig): Float32Array {
  const { scale, mean, std } = config.preprocess
  const plane = size * size
  if (rgba.length !== plane * 4) throw new Error(`Expected ${plane * 4} RGBA values, got ${rgba.length}`)
  const out = new Float32Array(plane * 3)
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) out[c * plane + i] = (rgba[i * 4 + c] * scale - mean[c]) / std[c]
  }
  return out
}

// In the browser or a worker: resize the whole image first, then crop, as torchvision does.
export function preprocessBitmap(bitmap: ImageBitmap, config: DiagnosisConfig): Float32Array {
  const g = resizeGeometry(bitmap.width, bitmap.height, config)
  const resized = new OffscreenCanvas(g.width, g.height)
  const ctx = resized.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, g.width, g.height)
  return toTensor(ctx.getImageData(g.left, g.top, g.size, g.size).data, g.size, config)
}
