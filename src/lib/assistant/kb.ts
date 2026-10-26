// The assistant's knowledge base: only text the app already shows farmers, so the assistant can
// never know more (or say anything riskier) than the screens. Built into the "kb_chunk" table by
// scripts/build-kb.ts. Each chunk carries a sentence saying where it sits in the app (contextual
// retrieval), which is embedded and searched along with the text.
import { CROPS, CROP_IDS } from '@/lib/crops'
import { DAY_STATE } from '@/lib/data'
import { ADVICE_SOURCE, CLASS_CONTENT } from '@/lib/diagnosis/content'
import { parseConfig } from '@/lib/diagnosis/config'
import { GUIDE, RISK_MEANING } from '@/lib/guide'
import { POTATO_GUIDE } from '@/lib/potatoGuide'
import configJson from '../../../public/model/crop_guardian_config.json'

export type KbChunk = {
  id: string
  title: string
  // Who said it, shown under the answer.
  source: string
  // The screen where the farmer can read the whole thing.
  href: string
  context: string
  text: string
}

const APP_SOURCE = 'Crop Guardian নির্দেশিকা'

const potato: KbChunk[] = POTATO_GUIDE.map((s) => ({
  id: `potato.${s.id}`,
  title: s.title,
  source: s.source,
  href: `/potato#${s.id}`,
  context: `ক্রপ গার্ডিয়ানের «আলু চাষের পরামর্শ» পাতার «${s.title}» অংশ, বাংলাদেশের গবেষণা থেকে।`,
  text: s.lines.join(' '),
}))

const guide: KbChunk[] = GUIDE.map((s) => ({
  id: `guide.${s.id}`,
  title: s.title,
  source: APP_SOURCE,
  href: `/guide#${s.id}`,
  context: `ক্রপ গার্ডিয়ান অ্যাপ কীভাবে ব্যবহার করবেন, নির্দেশিকার «${s.title}» অংশ।`,
  text: s.lines.join(' '),
}))

const labels = parseConfig(configJson).labelsBn

const disease: KbChunk[] = Object.entries(CLASS_CONTENT).map(([id, c]) => {
  const name = labels[id] ?? c.en
  return {
    id: `disease.${id}`,
    title: id === 'healthy' ? 'সুস্থ আলুর পাতা' : `আলুর ${name}`,
    source: ADVICE_SOURCE.label.replace(/^সূত্র:\s*/, ''),
    href: '/camera',
    context: `পাতার ছবি দেখে অ্যাপ «${name}» বললে যে পরামর্শ দেখায়।`,
    text: `চেনার উপায়: ${c.sign}। ${c.banner.text}। করণীয়: ${c.steps.join('; ')}।`,
  }
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
    text: [...levels, ...meaning].join(' '),
  }
})

export const KB: KbChunk[] = [...potato, ...disease, ...risk, ...guide]

// What is embedded and searched: where the chunk sits, then what it says.
export const searchText = (c: KbChunk): string => `${c.context}\n${c.title}\n${c.text}`

export const chunkById = (id: string): KbChunk | undefined => KB.find((c) => c.id === id)
