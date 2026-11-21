// The farmer's guide (/guide) and the first-run intro on Home, in short, plain Bengali.
// Every line here describes what the app really does; keep it in step with the screens.
import { BLAST_WET_HOURS, WET_MAX_C, WET_MIN_C } from '@/lib/blast'
import { type CropId, SEASONS } from '@/lib/crops'
import { HUMID_RH, HUTTON_HUMID_HOURS, MIN_TEMP_C } from '@/lib/risk'
import { EMERGENCE_DAYS, HARVEST_DAYS } from '@/lib/season'
import { toBnDigits } from '@/lib/bn'
import { canDiagnose } from '@/lib/diagnosis/crops'

export type GuideIcon =
  | 'pin'
  | 'risk'
  | 'camera'
  | 'question'
  | 'send'
  | 'ledger'
  | 'map'
  | 'offline'
  | 'warn'
  | 'sprout'
  | 'fog'
  | 'harvest'
  | 'store'
  | 'doc'

export type GuideSection = {
  id: string
  title: string
  icon: GuideIcon
  lines: string[]
  link?: { href: string; label: string }
}

// What the colours mean, as the first-run card says it; the assistant answers from this too.
export const RISK_COLOURS = 'সবুজ নিরাপদ, হলুদ সতর্ক, লাল বিপদ।'

export const RISK_MEANING = [
  { risk: 'safe', text: 'আবহাওয়া তুলনায় শুকনো। তবু নিয়মিত পাতা দেখতে থাকুন।' },
  { risk: 'watch', text: 'আবহাওয়া মাঝে মাঝে ভেজা। রোজ সকালে পাতা দেখুন, দাগ দেখলে ছবি তুলুন।' },
  { risk: 'danger', text: 'নাবি ধসা ছড়ানোর মতো আবহাওয়া। আজই পাতা দেখুন, দরকার হলে স্প্রে করুন।' },
] as const

// Each crop's rule as the guide states it. The assistant quotes these word for word: models asked to
// write the rule left its numbers out.
export const RISK_RULE: Record<CropId, string> = {
  potato: `ঝুঁকি আসে আবহাওয়ার পূর্বাভাস থেকে। রাতে ${toBnDigits(MIN_TEMP_C)}°সে-এর বেশি গরম আর দিনে ${toBnDigits(HUTTON_HUMID_HOURS)} ঘণ্টার বেশি ${toBnDigits(HUMID_RH)}% আর্দ্রতা টানা দুই দিন থাকলে বিপদ।`,
  paddy: `ধানের জমিতে দেখাই ব্লাস্টের ঝুঁকি। ${toBnDigits(WET_MIN_C)}–${toBnDigits(WET_MAX_C)}°সে তাপমাত্রায় দিনে ${toBnDigits(BLAST_WET_HOURS)} ঘণ্টার বেশি ${toBnDigits(HUMID_RH)}% আর্দ্রতা টানা দুই দিন থাকলে বিপদ।`,
}

// How to install Google's Bengali voice, for /guide and the tip «শুনুন» shows once when the phone has
// none. Menus differ between phones, so the settings search comes first and the menu path is a
// fallback. TODO: confirm on a real phone.
export const BENGALI_VOICE_STEPS = [
  'ফোনের সেটিংস খুলে ওপরের সার্চে ‘Text-to-speech’ বা ‘টেক্সট-টু-স্পিচ’ লিখুন।',
  'সেটা খুলে Google-এর ইঞ্জিনের পাশের ⚙ চাপুন। নাম ‘Speech Services by Google’ হতে পারে।',
  '‘Install voice data’ চেপে ‘বাংলা (বাংলাদেশ)’ নামিয়ে নিন।',
  'সার্চ না পেলে: সেটিংস → System বা General management → Language & input → Text-to-speech।',
]

export const GUIDE: GuideSection[] = [
  {
    id: 'start',
    title: 'শুরুতে: আপনার জমির খবর দিন',
    icon: 'pin',
    lines: [
      '«আমার জমি» পাতায় জেলা, উপজেলা আর ইউনিয়ন বেছে নিন। রংপুর আর রাজশাহী বিভাগের সব জেলা আর মুন্সীগঞ্জ আছে। সেখানকার আবহাওয়া দেখে ঝুঁকি বলব।',
      `ফসল বেছে নিন, তারপর কবে লাগিয়েছেন সেই তারিখ দিন। আলুতে চারা গজানো (রোপণের ${toBnDigits(EMERGENCE_DAYS)} দিন পর) থেকে ফসল তোলা (${toBnDigits(HARVEST_DAYS)} দিন) পর্যন্ত ঝুঁকির খবর দেব।`,
      'আলু, বোরো আর আমন ধান, প্রতিটার জমি আলাদা করে রাখা যায়। একসাথে একাধিক জমির মৌসুম চললে হোমে ওপরে বোতাম চেপে বদলান।',
      'তারিখ আর স্প্রের হিসাব আপনার ফোনেই রাখা থাকে। SMS চালু করলে শুধু ইউনিয়ন আর রোপণের তারিখ আমাদের কাছে যায়, ঠিক সময়ে খবর দিতে।',
    ],
    link: { href: '/planting?from=guide', label: 'আমার জমি' },
  },
  {
    id: 'risk',
    title: 'হোম: আজকের ঝুঁকির রং',
    icon: 'risk',
    lines: [
      RISK_RULE.potato,
      'নিচে ৫ দিনের পূর্বাভাস থাকে। সামনে বিপদ আসলে আগেই জানিয়ে দিই।',
      'মোবাইল নম্বর দিয়ে ঢুকে «আমার অ্যাকাউন্ট»-এ SMS চালু করলে বিপদের আগের দিন বিকেলে ফোনে SMS পাবেন, অ্যাপ না খুললেও।',
      'মৌসুম না থাকলে (চারা গজানোর আগে বা ফসল তোলার পরে) ঝুঁকি দেখাই না।',
    ],
  },
  {
    id: 'paddy',
    title: 'ধান: ব্লাস্ট রোগের ঝুঁকি (পরীক্ষামূলক)',
    icon: 'risk',
    lines: [
      RISK_RULE.paddy,
      `চারা রোয়ার ${toBnDigits(SEASONS.boro.startDays)} দিন পর থেকে ${toBnDigits(SEASONS.boro.endDays)} দিন পর্যন্ত খবর দিই, বোরো আর আমন দুই মৌসুমেই।`,
      'বিপদের দিনে পাতায় চোখের মতো দাগ আর শীষের গোড়া দেখুন। এই হিসাব এখনো মাঠে যাচাই হয়নি, সন্দেহ হলে কৃষি কর্মকর্তাকে জিজ্ঞেস করুন।',
    ],
    link: { href: '/planting?from=guide&season=boro', label: 'ধানের জমি যোগ করুন' },
  },
  {
    id: 'photo',
    title: 'পাতার ছবি তোলা',
    icon: 'camera',
    lines: [
      '«পাতার ছবি তুলুন» চাপুন। সন্দেহের পাতাটা ফ্রেমের ভেতরে আনুন।',
      'আলুতে: প্রথমে পাতার উপরের দিক, তারপর পাতা উল্টে নিচের দিকের ছবি তুলুন।',
      ...(canDiagnose('paddy') ? ['ধানে: দাগওয়ালা দুটো আলাদা পাতার ছবি তুলুন, পারলে দুই গোছা থেকে।'] : []),
      'দিনের আলোয় তুলুন, ফোন স্থির রাখুন। «আলো কম» বা «আরো কাছে আনুন» লেখা এলে সেই মতো ঠিক করুন।',
      'প্রথমবার নেট লাগে, রোগ চেনার মডেল নামাতে। তারপর নেট ছাড়াও চলে।',
      canDiagnose('paddy')
        ? 'আলু আর ধানের পাতা চেনে। ক্যামেরার নিচে কোন ফসল, তা বেছে নিন।'
        : 'এখন শুধু আলুর পাতা চেনে। ধানের পাতা চেনা পরে আসবে।',
    ],
    link: { href: '/camera', label: 'পাতার ছবি তুলুন' },
  },
  {
    id: 'result',
    title: 'ফলাফল বোঝা',
    icon: 'question',
    lines: [
      'নিশ্চিত: রোগের নাম আর এখন কী করবেন, ধাপে ধাপে।',
      'নিশ্চিত নই: কয়েকটা রোগ হতে পারে। পাতা দেখে ছোট প্রশ্নের হ্যাঁ বা না উত্তর দিন। না জানলে «জানি না» চাপুন, তাতে কোনো ক্ষতি নেই।',
      'চিনতে পারিনি: ভুল নাম বলার বদলে অ্যাপ সৎভাবে বলে দেয়। কৃষি কর্মকর্তাকে পাঠান, বা আবার ছবি তুলুন।',
      '«কেন মনে হলো?» অংশে দেখবেন ফল কোথা থেকে এল: ছবি, আবহাওয়া আর আপনার উত্তর।',
    ],
  },
  {
    id: 'officer',
    title: 'কৃষি কর্মকর্তাকে পাঠানো',
    icon: 'send',
    lines: [
      'ফলাফলের নিচে «কৃষি কর্মকর্তাকে পাঠান» চাপুন। দুই ছবি আর একটা ছোট সারাংশ WhatsApp বা অন্য অ্যাপে পাঠাতে পারবেন।',
      'মোবাইল নম্বর দিয়ে ঢুকে থাকলে কেসটা কর্মকর্তার তালিকাতেও যায়। তিনি ছবি দেখে যাচাই করেন, দরকারে আপনাকে ফোন করতে পারেন।',
      'নেট না থাকলে কেস ফোনে রাখা থাকে, নেট এলে নিজেই চলে যায়।',
    ],
    link: { href: '/sign-in?next=/guide', label: 'মোবাইল নম্বর দিয়ে ঢুকুন' },
  },
  {
    id: 'ledger',
    title: 'স্প্রে লিখে রাখা আর মৌসুমের হিসাব',
    icon: 'ledger',
    lines: [
      'যেদিন স্প্রে করবেন, «আজ স্প্রে করেছি» চাপুন। বোতামটা হিসাব পাতায় থাকে, আর বিপদের দিনে হোমেও।',
      'হিসাব পাতা প্রতি সপ্তাহের আসল আবহাওয়া আর আপনার স্প্রে মিলিয়ে দেখায়।',
      'বিপদের সপ্তাহে স্প্রে লেখা না থাকলে সেটাও দেখাই।',
      'ঝুঁকির এই হিসাব পরীক্ষামূলক, এখনো মাঠে যাচাই হয়নি। তাই টাকার হিসাব দেখাই না, শুধু বিপদের সপ্তাহ আর আপনার স্প্রে।',
    ],
    link: { href: '/ledger', label: 'হিসাব দেখুন' },
  },
  {
    id: 'map',
    title: 'এলাকার ম্যাপ',
    icon: 'map',
    lines: [
      'ম্যাপে আপনার উপজেলার প্রতিটা ইউনিয়নের আজকের ঝুঁকির রং।',
      'কালো গোলে সংখ্যা মানে, সেই ইউনিয়নে কৃষি কর্মকর্তা কতগুলো নাবি ধসা নিশ্চিত করেছেন।',
      'হলুদ «আপনি» চিহ্ন আপনার ইউনিয়ন। পাশের ইউনিয়নে বিপদ বাড়লে নিজের জমি বেশি করে দেখুন।',
    ],
    link: { href: '/map', label: 'ম্যাপ দেখুন' },
  },
  {
    id: 'potato',
    title: 'আলু চাষের পরামর্শ',
    icon: 'sprout',
    lines: [
      'লাগানো, নাবি ধসা, ঢলে পড়া, আলু তোলা আর ঘরে বা হিমাগারে রাখার পরামর্শ আলাদা পাতায় আছে, বাংলাদেশের গবেষণা থেকে।',
      'এই পাতাও নেট ছাড়া খোলে।',
    ],
    link: { href: '/potato', label: 'পরামর্শ দেখুন' },
  },
  {
    id: 'offline',
    title: 'নেট না থাকলে',
    icon: 'offline',
    lines: [
      'একবার নেট দিয়ে ছবি তোলার পাতা খুলে রাখলে, পরে নেট ছাড়াও ছবি তোলা আর রোগ চেনা চলে। এই নির্দেশিকাও খোলে।',
      'আবহাওয়ার ঝুঁকি, ম্যাপ আর হিসাবের জন্য নেট লাগে। পুরনো ঝুঁকিকে আমরা কখনো আজকের বলে দেখাই না।',
    ],
  },
  {
    id: 'safety',
    title: 'সাবধানতা',
    icon: 'warn',
    lines: [
      'ওষুধ সবসময় বোতলের লেবেল অনুযায়ী মেপে দিন। স্প্রের সময় মাস্ক আর গ্লাভস পরুন।',
      'অ্যাপটি পরীক্ষামূলক। সন্দেহ হলে উপসহকারী কৃষি কর্মকর্তার পরামর্শ নিন।',
      'যেকোনো পাতায় «শুনুন» বোতাম চাপলে পড়ে শোনাবে।',
    ],
  },
  {
    id: 'listen',
    title: 'বাংলায় পড়ে শোনানো',
    icon: 'doc',
    lines: [
      'ফোনে বাংলা কণ্ঠ না থাকলে «শুনুন» ঠিকমতো পড়তে পারে না। একবার নামিয়ে নিলেই হবে, তারপর নেট ছাড়াও চলে।',
      ...BENGALI_VOICE_STEPS,
    ],
  },
]

// The four cards shown once, the first time the app opens.
export const INTRO: { title: string; text: string; icon: GuideIcon }[] = [
  {
    icon: 'risk',
    title: 'রোজ সকালে ঝুঁকির রং দেখুন',
    text: `${RISK_COLOURS} আবহাওয়া দেখে বলি কবে রোগ ছড়ানোর ঝুঁকি বাড়ছে।`,
  },
  {
    icon: 'camera',
    title: 'সন্দেহ হলে পাতার ছবি তুলুন',
    text: 'পাতার উপরের দিক, তারপর নিচের দিক। নিশ্চিত না হলে সৎভাবে বলব, আর কৃষি কর্মকর্তাকে পাঠাতে সাহায্য করব।',
  },
  {
    icon: 'ledger',
    title: 'স্প্রে লিখে রাখুন',
    text: 'যেদিন স্প্রে করবেন, «আজ স্প্রে করেছি» চাপুন। মৌসুম শেষে দেখবেন বিপদের সপ্তাহে স্প্রে করেছিলেন কি না।',
  },
  {
    icon: 'pin',
    title: 'শুরু করতে জমির খবর দিন',
    text: 'আপনার এলাকা, আর আলু বা ধান কবে লাগিয়েছেন সেই তারিখ দিন। পরে যেকোনো সময় হোমের ওপরে «?» চেপে নির্দেশিকা দেখবেন।',
  },
]

export const speechOf = (s: { title: string; lines?: string[]; text?: string }) => [s.title, ...(s.lines ?? []), s.text ?? ''].filter(Boolean).join('। ')
