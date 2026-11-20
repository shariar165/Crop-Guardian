// The camera's quality check on an image file, in Node (scripts and tests only, never the browser).
// It follows CameraScreen's gallery path: the whole photo, EXIF-rotated, scaled to ANALYSIS_WIDTH.
// It skips the app's JPEG re-encode, which barely moves brightness, sharpness or the green share.
import { ANALYSIS_WIDTH, assessQuality, type QualityReport } from '@/lib/imageQuality'

export async function qualityOfFile(path: string, leafNear?: number): Promise<QualityReport> {
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(path)
    .rotate()
    .resize({ width: ANALYSIS_WIDTH, kernel: 'linear' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return assessQuality({ data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height }, { leafNear })
}
