// Fixed advice for each class a crop's model can name. Doses are never given here: always the label's,
// or the agriculture officer's. The text should be reviewed by an agronomist before field use.
import type { CropId } from '@/lib/crops'

export type Source = { label: string; href: string }

export type ClassContent = {
  en: string
  // What the farmer can see on the leaf.
  sign: string
  // Shown under the name: urgent for disease, reassuring for a healthy leaf.
  banner: { text: string; tone: 'danger' | 'watch' | 'ok' }
  steps: string[]
  // Where the steps come from, when not the crop's usual source.
  source?: Source
}

const RECHECK = '৫–৭ দিন পর আবার পাতার ছবি তুলুন'
const LABEL = 'মাত্রা: বোতলের লেবেল অনুযায়ী'
const SPRAY = `অনুমোদিত ছত্রাকনাশক স্প্রে করুন। কোন ওষুধ দেবেন, উপসহকারী কৃষি কর্মকর্তার কাছে জেনে নিন। ${LABEL}`

const POTATO: Record<string, ClassContent> = {
  late_blight: {
    en: 'Late blight',
    sign: 'পানিভেজা বাদামি দাগ, কিনারায় ফ্যাকাশে বলয়',
    banner: { text: 'দ্রুত ছড়ায় — আজই ব্যবস্থা নিন', tone: 'danger' },
    steps: ['আক্রান্ত পাতা ও গাছ তুলে মাটিতে পুঁতে ফেলুন', SPRAY, RECHECK],
  },
  early_blight: {
    en: 'Early blight',
    sign: 'গোল দাগের ভেতর চাকতির মতো রিং',
    banner: { text: 'নিচের পাতা থেকে ওপরে ছড়ায় — এ সপ্তাহেই ব্যবস্থা নিন', tone: 'watch' },
    steps: ['দাগওয়ালা নিচের পাতা তুলে মাটিতে পুঁতে ফেলুন', SPRAY, RECHECK],
  },
  healthy: {
    en: 'Healthy',
    sign: 'দাগ নেই, পাতা সবুজ ও সতেজ',
    banner: { text: 'এখন ওষুধ লাগবে না', tone: 'ok' },
    steps: ['এখন ছত্রাকনাশক দেবেন না', 'হোমে রোজ আবহাওয়ার ঝুঁকি দেখুন', 'নতুন দাগ দেখলে বা ৫–৭ দিন পর আবার ছবি তুলুন'],
  },
}

// BRRI's plant pathology division, "ব্লাস্ট রোগ দমনে জরুরী সতর্কবার্তা", 19 March 2023: blast and BLB.
const BRRI_ALERT: Source = {
  label: 'সূত্র: ব্রি উদ্ভিদ রোগতত্ত্ব বিভাগ, ব্লাস্ট ও পাতাপোড়া সতর্কবার্তা (২০২৩)',
  href: 'https://brri.portal.gov.bd/sites/default/files/files/brri.portal.gov.bd/news/245bba32_a089_4da8_9845_d9afcddf455f/2023-04-05-05-24-b9fb45272dcf3a51acb0e89254944725.pdf',
}
// Rice Doctor fact sheets (Lucid, with IRRI) for the diseases the BRRI alert doesn't cover.
const RICE_DOCTOR = (page: string): Source => ({
  label: 'সূত্র: Rice Doctor ফ্যাক্টশিট (IRRI-র সহযোগী)',
  href: `https://keyserver.lucidcentral.org/key-server/data/0e090d01-0209-460e-810c-0d060708030c/media/Html/${page}.htm`,
})

const PADDY: Record<string, ClassContent> = {
  blast: {
    en: 'Blast',
    sign: 'চোখের মতো লম্বাটে দাগ, দুই মাথা সরু, মাঝখানটা ছাই রঙের',
    banner: { text: 'মেঘলা-বৃষ্টিতে দ্রুত ছড়ায় — আজই ব্যবস্থা নিন', tone: 'danger' },
    steps: [
      `ট্রাইসাইক্লাজোল বা স্ট্রোবিলুরিন গ্রুপের ছত্রাকনাশক স্প্রে করুন, ৭–১০ দিন পর আরেকবার। ${LABEL}`,
      'শীষ বের হওয়ার সময় হলে তখনও একইভাবে স্প্রে করুন, যেন শীষ ব্লাস্ট না হয়',
      'বৃষ্টি দেখে স্প্রে করুন, যেন ওষুধ ধুয়ে না যায়',
    ],
    source: BRRI_ALERT,
  },
  bacterial_leaf_blight: {
    en: 'Bacterial leaf blight',
    sign: 'পাতার আগা থেকে কিনারা ধরে হলুদ-সাদাটে হয়ে খড়ের মতো শুকায়',
    banner: { text: 'ঝড়-বৃষ্টির পর বাড়ে — এ সপ্তাহেই ব্যবস্থা নিন', tone: 'watch' },
    steps: [
      'এখন ইউরিয়া সার দেবেন না',
      'ঝড়-বৃষ্টি থামলে পটাশ সার ও জিপসাম দিন। মাত্রা: কৃষি কর্মকর্তার পরামর্শে',
      'বেশি ছড়ালে কৃষি কর্মকর্তাকে দেখান: পটাশ, জিপসাম ও দস্তা গুলে স্প্রে করা যায়',
      RECHECK,
    ],
    source: BRRI_ALERT,
  },
  brown_spot: {
    en: 'Brown spot',
    sign: 'গোল বা ডিমের মতো বাদামি দাগ, মাঝখানটা হালকা, কিনারা লালচে বাদামি',
    banner: { text: 'দুর্বল মাটিতে বাড়ে — সার ঠিক করুন', tone: 'watch' },
    steps: [
      'কৃষি কর্মকর্তার কাছে মাটি পরীক্ষা করিয়ে যে সার কম, তা দিন',
      'পরের বার বীজ শোধন করে বুনুন (গরম পানিতে, বা ছত্রাকনাশকে লেবেল অনুযায়ী)',
      RECHECK,
    ],
    source: RICE_DOCTOR('Brown_spot'),
  },
  sheath_blight: {
    en: 'Sheath blight',
    sign: 'গোড়ার খোলে পানির ঠিক ওপরে ধূসর-সবুজ ডিমের মতো ছোপ, ওপরে ছড়ায়',
    banner: { text: 'ঘন, ভেজা জমিতে ছড়ায় — এ সপ্তাহেই ব্যবস্থা নিন', tone: 'watch' },
    steps: [
      'ইউরিয়া বেশি দেবেন না, পরিমিত দিন',
      'জমি ও আইলের আগাছা পরিষ্কার করুন',
      'পরের বার চারা একটু ফাঁকা করে লাগান, যেন গোড়ায় বাতাস চলে',
      RECHECK,
    ],
    source: RICE_DOCTOR('Sheath_blight'),
  },
  tungro: {
    en: 'Tungro',
    sign: 'গাছ খাটো, কুশি কম, পাতা আগা থেকে কমলা-হলুদ',
    // Yellowing alone looks like a nitrogen or zinc shortage; Rice Doctor warns sight alone is unreliable.
    banner: { text: 'সার কম হলেও এমন দেখায় — কর্মকর্তাকে দেখিয়ে নিশ্চিত হোন', tone: 'watch' },
    steps: [
      'হলুদ দেখে শুধু ইউরিয়া দেবেন না, আগে কৃষি কর্মকর্তাকে দেখান',
      'জমিতে সবুজ পাতাফড়িং আছে কি না দেখুন: এরাই রোগ ছড়ায়',
      'ধান কাটার পরই নাড়া চাষ দিয়ে মাটিতে মিশিয়ে দিন',
      'পরের বার পাশের জমির সাথে একই সময়ে, দেরি না করে রোপণ করুন',
    ],
    source: RICE_DOCTOR('Tungro'),
  },
  healthy: {
    en: 'Healthy',
    sign: 'দাগ নেই, পাতা সবুজ ও সতেজ',
    banner: { text: 'এখন ওষুধ লাগবে না', tone: 'ok' },
    steps: ['এখন কোনো বালাইনাশক দেবেন না', 'হোমে রোজ আবহাওয়ার ঝুঁকি দেখুন', 'নতুন দাগ দেখলে বা ৫–৭ দিন পর আবার ছবি তুলুন'],
  },
}

export const CLASS_CONTENT: Record<CropId, Record<string, ClassContent>> = { potato: POTATO, paddy: PADDY }

const CROP_SOURCE: Record<CropId, Source> = {
  potato: { label: 'সূত্র: কৃষি সম্প্রসারণ অধিদপ্তরের নির্দেশিকা', href: 'https://dae.gov.bd' },
  paddy: { label: 'সূত্র: বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি)', href: 'https://brri.gov.bd' },
}

export const contentOf = (crop: CropId, id: string): ClassContent | undefined => CLASS_CONTENT[crop][id]

export const sourceOf = (crop: CropId, id: string): Source => contentOf(crop, id)?.source ?? CROP_SOURCE[crop]
