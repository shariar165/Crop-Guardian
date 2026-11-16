// Sample leaves for showcase mode (src/lib/showcase.ts): real images from the training notebook's
// parity set (src/lib/diagnosis/__fixtures__/parity/), served from public/samples/. They go through
// the real model and the normal result screens, never the ?mock path, and the result says it came
// from a sample. `fixture` ties each to its notebook output, so a test checks the app still agrees.
import type { CropId } from '@/lib/crops'

export type SampleLeaf = {
  id: string
  crop: CropId
  src: string
  fixture: string
  // What the leaf really is, shown on the button before the model looks.
  truthBn: string
  truthEn: string
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  { id: 'potato-healthy', crop: 'potato', src: '/samples/potato/healthy.jpg', fixture: 'healthy_0.jpg', truthBn: 'সুস্থ পাতা', truthEn: 'Healthy' },
  { id: 'potato-late-blight', crop: 'potato', src: '/samples/potato/late_blight.jpg', fixture: 'late_blight_0.jpg', truthBn: 'নাবি ধসা', truthEn: 'Late blight' },
  // A virus: the model never saw it in training (held out, leave-class-out), so it should say "unknown".
  { id: 'potato-unseen-virus', crop: 'potato', src: '/samples/potato/unseen_virus.jpg', fixture: 'unseen_disease_3.jpg', truthBn: 'অচেনা রোগ (ভাইরাস)', truthEn: 'A disease it never saw' },
]

export const samplesFor = (crop: CropId): SampleLeaf[] => SAMPLE_LEAVES.filter((s) => s.crop === crop)
export const sampleById = (id: string | undefined): SampleLeaf | undefined => SAMPLE_LEAVES.find((s) => s.id === id)

export const SAMPLE_BUTTON = 'নমুনা ছবি দিয়ে দেখুন / Try a sample leaf'
export const SAMPLE_NOTE = 'নমুনা ছবি, পরীক্ষার সেট থেকে · sample image from the test set'
