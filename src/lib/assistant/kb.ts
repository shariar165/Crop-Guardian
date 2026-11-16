// The assistant's knowledge base: only text the app already shows farmers, so the assistant can
// never know more (or say anything riskier) than the screens. Built into the "kb_chunk" table by
// scripts/build-kb.ts. Each chunk carries a sentence saying where it sits in the app (contextual
// retrieval), which is embedded and searched along with the text.
import { CROPS, CROP_IDS, type CropId } from '@/lib/crops'
import { DAY_STATE } from '@/lib/data'
import { CLASS_CONTENT, sourceOf } from '@/lib/diagnosis/content'
import { PHOTO_CROPS, PHOTO_SPECS } from '@/lib/diagnosis/crops'
import { GUIDE, type GuideSection, RISK_COLOURS, RISK_MEANING } from '@/lib/guide'
import { POTATO_GUIDE } from '@/lib/potatoGuide'
import { wordsOf } from './tokens'

// What the database returns for a passage.
export type KbPassage = {
  id: string
  title: string
  // Who said it, shown under the answer.
  source: string
  // The screen where the farmer can read the whole thing.
  href: string
  context: string
  text: string
}

// Tagged here rather than in the table: search limits itself to these ids, so a tag change needs no
// migration. null means the chunk holds for every crop, or for no one disease of its crop.
export type KbChunk = KbPassage & { crop: CropId | null; disease: string | null }

const APP_SOURCE = 'Crop Guardian নির্দেশিকা'

const potato: KbChunk[] = POTATO_GUIDE.map((s) => ({
  id: `potato.${s.id}`,
  title: s.title,
  source: s.source,
  href: `/potato#${s.id}`,
  context: `ক্রপ গার্ডিয়ানের «আলু চাষের পরামর্শ» পাতার «${s.title}» অংশ, বাংলাদেশের গবেষণা থেকে।`,
  text: s.lines.join(' '),
  crop: 'potato',
  disease: s.id === 'blight' ? 'late_blight' : null,
}))

// Sections written for one crop, though the guide shows them to everyone. The risk section is
// potato's rule, so calling it crop-neutral is how that rule reached paddy answers.
const GUIDE_SCOPE: Record<string, Pick<KbChunk, 'crop' | 'disease'>> = {
  risk: { crop: 'potato', disease: 'late_blight' },
  paddy: { crop: 'paddy', disease: 'blast' },
  potato: { crop: 'potato', disease: null },
}

// The SMS line sits in the risk section but holds for every crop, and an SMS question must not have
// to say which.
const SMS_LINE = /SMS চালু/

const guideChunk = (s: GuideSection, lines = s.lines): KbChunk => ({
  id: `guide.${s.id}`,
  title: s.title,
  source: APP_SOURCE,
  href: `/guide#${s.id}`,
  context: `ক্রপ গার্ডিয়ান অ্যাপ কীভাবে ব্যবহার করবেন, নির্দেশিকার «${s.title}» অংশ।`,
  text: lines.join(' '),
  ...(GUIDE_SCOPE[s.id] ?? { crop: null, disease: null }),
})

const riskSection = GUIDE.find((s) => s.id === 'risk')!
const guide: KbChunk[] = [
  ...GUIDE.filter((s) => s.id !== 'photo').map((s) => (s === riskSection ? guideChunk(s, s.lines.filter((l) => !SMS_LINE.test(l))) : guideChunk(s))),
  guideChunk({ ...riskSection, id: 'sms', title: 'বিপদের SMS' }, riskSection.lines.filter((l) => SMS_LINE.test(l))),
]

// Where the guide's own words for each crop's rule live, for quoting them with their source.
export const RULE_CHUNK: Record<CropId, string> = { potato: 'guide.risk', paddy: 'guide.paddy' }

// The guide's photo section, minus the line each crop has for itself below.
const ONE_CROP_LINE = /^(আলুতে|ধানে):/
const [pressButton, ...afterPhotos] = GUIDE.find((s) => s.id === 'photo')!.lines.filter((l) => !ONE_CROP_LINE.test(l))

// One whole set of instructions per crop, with the two photos first and the camera's own words:
// paddy's second photo is another leaf, not the underside. Split across two chunks, models gave the
// general tips and left out the steps.
const photoSteps: KbChunk[] = PHOTO_CROPS.map((crop) => {
  const { top, under } = PHOTO_SPECS[crop].photos
  return {
    id: `photo.${crop}`,
    title: `${CROPS[crop].ofBn} পাতার ছবি তোলা`,
    source: APP_SOURCE,
    href: '/camera',
    context: `ক্যামেরায় ${CROPS[crop].ofBn} পাতার যে দুটো ছবি তুলতে হয়।`,
    text: `${pressButton} প্রথম ছবি: ${top.title}। ${top.sub}। দ্বিতীয় ছবি: ${under.title}। ${under.sub}। ${afterPhotos.join(' ')}`,
    crop,
    disease: null,
  }
})

// The labels in PHOTO_SPECS are tested against each crop's model config.
const disease: KbChunk[] = PHOTO_CROPS.flatMap((crop) => {
  const spec = CROPS[crop]
  return Object.entries(CLASS_CONTENT[crop]).map(([id, c]) => {
    const name = PHOTO_SPECS[crop].labelsBn[id] ?? c.en
    return {
      // Potato's ids predate paddy and are named by the prompts and the eval set.
      id: crop === 'potato' ? `disease.${id}` : `disease.${crop}.${id}`,
      title: `${id === 'healthy' ? `সুস্থ ${spec.ofBn} পাতা` : `${spec.ofBn} ${name}`}${spec.experimental ? ' (পরীক্ষামূলক)' : ''}`,
      source: sourceOf(crop, id).label.replace(/^সূত্র:\s*/, ''),
      href: '/camera',
      context: `${spec.ofBn} পাতার ছবি দেখে অ্যাপ «${name}» বললে যে পরামর্শ দেখায়।`,
      text: `চেনার উপায়: ${c.sign}। ${c.banner.text}। করণীয়: ${c.steps.join('; ')}।`,
      crop,
      disease: id === 'healthy' ? null : id,
    }
  })
})

const risk: KbChunk[] = CROP_IDS.map((crop) => {
  const spec = CROPS[crop]
  const levels = (['safe', 'watch', 'danger'] as const).map((r) => `${DAY_STATE[r].word}: ${spec.decision[r]}`)
  // The colour meanings in RISK_MEANING are written for potato late blight.
  const meaning = crop === 'potato' ? RISK_MEANING.map((m) => m.text) : []
  return {
    id: `risk.${crop}`,
    title: `${spec.ofBn} ${spec.diseaseBn} ঝুঁকির রং${spec.experimental ? ' (পরীক্ষামূলক)' : ''}`,
    source: APP_SOURCE,
    href: '/',
    context: `হোম পাতায় ${spec.ofBn} ${spec.diseaseBn} রোগের আজকের ঝুঁকির রং কী বোঝায়।`,
    text: [RISK_COLOURS, ...levels, ...meaning].join(' '),
    crop,
    disease: crop === 'potato' ? 'late_blight' : 'blast',
  }
})

export const KB: KbChunk[] = [...potato, ...disease, ...risk, ...guide, ...photoSteps]

// What one search may read. A disease narrows the crop's chunks but keeps those about no one disease.
export type KbScope = { crop: CropId | null; disease: string | null }
export const NO_SCOPE: KbScope = { crop: null, disease: null }

export const inScope = (c: KbChunk, s: KbScope): boolean =>
  (s.crop === null || c.crop === null || c.crop === s.crop) && (s.disease === null || c.disease === null || c.disease === s.disease)

export const idsInScope = (s: KbScope): string[] => KB.filter((c) => inScope(c, s)).map((c) => c.id)

// Whole words, so প্রধান, সমাধান and আমন্ত্রণ don't read as paddy. Things only one crop has count too.
const CROP_WORD: Record<CropId, RegExp> = {
  potato: /^(আলু|ধসা|হিমাগার|potato)/,
  paddy: /^(ধান|বোরো|আমন$|আমনে|ব্লাস্ট|টুংরো|শীষ|paddy|rice)/,
}

export const namedCrops = (text: string): CropId[] => {
  const words = wordsOf(text)
  return CROP_IDS.filter((c) => words.some((w) => CROP_WORD[c].test(w)))
}

// The farmer's own words beat everything: naming a crop is not a judgement call, and a wrong guess
// here is how one crop's advice reaches the other. Then the model's reading (given only for a
// follow-up, see ask()), then the field in season on the farmer's phone.
export function questionScope(question: string, model: { crop?: string | null; disease?: string | null } = {}, field: CropId | null = null): KbScope {
  const named = namedCrops(question)
  const crop = named.length === 2 ? null : (named[0] ?? CROP_IDS.find((c) => c === model.crop) ?? field)
  if (!crop) return NO_SCOPE
  const labels = Object.entries(PHOTO_SPECS[crop].labelsBn).filter(([id]) => id !== 'healthy')
  const diseases = labels.filter(([, bn]) => question.includes(bn)).map(([id]) => id)
  // Two named diseases are a comparison, which needs both.
  if (diseases.length > 1) return { crop, disease: null }
  const guess = labels.find(([id]) => id === model.disease)?.[0] ?? null
  return { crop, disease: diseases[0] ?? guess }
}

// What is embedded and searched: where the chunk sits, then what it says.
export const searchText = (c: KbChunk): string => `${c.context}\n${c.title}\n${c.text}`

export const chunkById = (id: string): KbChunk | undefined => KB.find((c) => c.id === id)
