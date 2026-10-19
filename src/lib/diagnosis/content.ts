// Fixed advice for each class the model can name. Doses are never given here: always the label's.
// The text should be reviewed by an agronomist before field use.

export type ClassContent = {
  en: string
  // What the farmer can see on the leaf.
  sign: string
  // Shown under the name: urgent for disease, reassuring for a healthy leaf.
  banner: { text: string; tone: 'danger' | 'watch' | 'ok' }
  steps: string[]
}

export const ADVICE_SOURCE = { label: 'সূত্র: কৃষি সম্প্রসারণ অধিদপ্তরের নির্দেশিকা', href: 'https://dae.gov.bd' }

const RECHECK = '৫–৭ দিন পর আবার পাতার ছবি তুলুন'
const SPRAY = 'অনুমোদিত ছত্রাকনাশক স্প্রে করুন। মাত্রা: বোতলের লেবেল অনুযায়ী'

export const CLASS_CONTENT: Record<string, ClassContent> = {
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
