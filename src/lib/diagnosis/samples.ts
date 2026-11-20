// Sample leaves for showcase mode (src/lib/showcase.ts): real images from the training notebook's
// parity set (src/lib/diagnosis/__fixtures__/parity/), served from public/samples/. Which split each
// came from (and whether the "other" class saw viruses) isn't confirmed from notebook 04 yet, so the
// labels claim only that they're from the model's dataset. They go through
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
  // A virus, not one of the model's three diseases, so it should say "unknown".
  { id: 'potato-unseen-virus', crop: 'potato', src: '/samples/potato/unseen_virus.jpg', fixture: 'unseen_disease_3.jpg', truthBn: 'অন্য রোগ (ভাইরাস)', truthEn: 'Virus (not one of its three diseases)' },
]

export const samplesFor = (crop: CropId): SampleLeaf[] => SAMPLE_LEAVES.filter((s) => s.crop === crop)
export const sampleById = (id: string | undefined): SampleLeaf | undefined => SAMPLE_LEAVES.find((s) => s.id === id)

export const SAMPLE_BUTTON = 'নমুনা ছবি দিয়ে দেখুন / Try a sample leaf'
export const SAMPLE_NOTE = 'মডেলের ডেটাসেটের ছবি · image from the model’s dataset'
