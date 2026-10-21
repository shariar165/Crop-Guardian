// What the leaf-photo diagnosis needs per crop: the exported model's config, the two photos it asks
// for, and how honest its results can be. The weather side of each crop lives in src/lib/crops.ts.
import type { CropId } from '@/lib/crops'

export type PhotoStep = {
  // The camera's instruction, and the line under it.
  title: string
  sub: string
  // Under the shutter, while this photo is being taken.
  counter: string
  // This photo in "কেন মনে হলো?" and the officer's summary.
  name: string
}

export type PhotoCropSpec = {
  configUrl: string
  // The classes the exported config must have (without "other") and their Bengali names, which the
  // config must match (tested). Advice and questions are written for these, and the officer's list
  // reads them, so a crop's cases can be shown on the server without its config.
  labelsBn: Record<string, string>
  photos: { top: PhotoStep; under: PhotoStep }
  // Where the thresholds were checked: shown on every result.
  validation: string
  // The weather risk shown next to a result, e.g. "ধসার আবহাওয়া-ঝুঁকি".
  riskLabel: string
}

export const PHOTO_SPECS: Record<CropId, PhotoCropSpec> = {
  potato: {
    configUrl: '/model/crop_guardian_config.json',
    labelsBn: { early_blight: 'আগাম ধসা', healthy: 'সুস্থ', late_blight: 'নাবি ধসা' },
    photos: {
      top: { title: 'পাতার উপরের দিকটা তুলুন', sub: 'পুরো পাতা ফ্রেমের ভেতরে রাখুন', counter: 'পাতার উপরের দিক', name: 'পাতার উপরের দিক' },
      under: { title: 'এবার পাতার নিচের দিকটা তুলুন', sub: 'দাগ চিনতে নিচের দিকটা জরুরি', counter: 'উপরের দিক তোলা হয়েছে', name: 'নিচের দিক' },
    },
    validation: 'পরীক্ষামূলক: ইন্দোনেশিয়ার মাঠের ছবিতে যাচাই করা',
    riskLabel: 'ধসার আবহাওয়া-ঝুঁকি',
  },
  paddy: {
    configUrl: '/model/paddy/crop_guardian_paddy_config.json',
    labelsBn: {
      bacterial_leaf_blight: 'পাতা পোড়া',
      blast: 'ব্লাস্ট',
      brown_spot: 'বাদামি দাগ',
      healthy: 'সুস্থ',
      sheath_blight: 'খোল পোড়া',
      tungro: 'টুংরো',
    },
    // The training photos are single leaves (or sheaths) from the top, so the second photo is
    // another affected leaf, not the underside.
    photos: {
      top: { title: 'দাগওয়ালা পাতাটা কাছ থেকে তুলুন', sub: 'দাগ পাতায় বা খোলে থাকলে সেটাই ফ্রেমে রাখুন', counter: 'প্রথম পাতা', name: 'প্রথম পাতা' },
      under: { title: 'এবার আরেকটা আক্রান্ত পাতা তুলুন', sub: 'অন্য গোছা থেকে নিলে ভালো', counter: 'প্রথম পাতা তোলা হয়েছে', name: 'দ্বিতীয় পাতা' },
    },
    validation: 'পরীক্ষামূলক: বাংলাদেশের মাঠের ছবিতে যাচাই করা',
    riskLabel: 'ব্লাস্টের আবহাওয়া-ঝুঁকি (পরীক্ষামূলক)',
  },
}

// Crops whose model and config are in public/model. Add a crop once the training notebook's export
// is in place; the tests check the files, the classes, the advice and the questions.
export const PHOTO_CROPS: CropId[] = ['potato']

export const canDiagnose = (crop: CropId) => PHOTO_CROPS.includes(crop)

// Diagnoses saved before paddy were all potato.
export const cropOfRecord = (record: { crop?: CropId }): CropId => record.crop ?? 'potato'

export const configUrlOf = (crop: CropId) => PHOTO_SPECS[crop].configUrl

export const classesOf = (crop: CropId) => Object.keys(PHOTO_SPECS[crop].labelsBn)
