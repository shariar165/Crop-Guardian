// Every crop the weather risk covers, and its seasons. Screens read names, disease rule and
// season windows from here, so none of them hard-codes আলু, ধসা or Hutton.
// Paddy's rule and windows are drafts to confirm with BRRI and the backtest (docs/blast-backtest.md).
import { assessBlast, BLAST_DECISION, classifyBlastDays, summarizeBlastDays } from '@/lib/blast'
import type { Risk } from '@/lib/data'
import { assessRisk, classifyDays, DECISION, type RiskAssessment, type StripDay, summarizeDays } from '@/lib/risk'
import type { HourlyForecast } from '@/lib/weather'

export type CropId = 'potato' | 'paddy'
export const CROP_IDS: CropId[] = ['potato', 'paddy']
export const isCropId = (v: unknown): v is CropId => CROP_IDS.includes(v as CropId)

export type SeasonId = 'potato' | 'boro' | 'aman'
export const SEASON_IDS: SeasonId[] = ['potato', 'boro', 'aman']
export const isSeasonId = (v: unknown): v is SeasonId => SEASON_IDS.includes(v as SeasonId)

export type MonthDay = { month: number; day: number }

export type SeasonSpec = {
  crop: CropId
  nameBn: string
  // Days after planting (potato) or transplanting (paddy) when risk starts, once the crop is up or
  // established, and ends, at harvest. Both inclusive.
  startDays: number
  endDays: number
  // The usual window when no date is given; it may run across the new year.
  fallback: { start: MonthDay; end: MonthDay }
}

export const SEASONS: Record<SeasonId, SeasonSpec> = {
  potato: { crop: 'potato', nameBn: 'আলু', startDays: 15, endDays: 100, fallback: { start: { month: 11, day: 15 }, end: { month: 3, day: 15 } } },
  boro: { crop: 'paddy', nameBn: 'বোরো ধান', startDays: 15, endDays: 110, fallback: { start: { month: 1, day: 1 }, end: { month: 5, day: 15 } } },
  aman: { crop: 'paddy', nameBn: 'আমন ধান', startDays: 15, endDays: 110, fallback: { start: { month: 7, day: 15 }, end: { month: 11, day: 15 } } },
}

export type CropSpec = {
  nameBn: string
  // "আলুর", "ধানের"
  ofBn: string
  diseaseBn: string
  riskTitle: string
  offSeasonTitle: string
  // "আলু কবে লাগিয়েছেন?"
  plantedQuestion: string
  // When alerts start, before the date: "চারা গজালে, … থেকে ঝুঁকির খবর দেব".
  startPhrase: string
  afterHarvest: string
  // Shown as "পরীক্ষামূলক" until the rule is validated against real outbreaks.
  experimental: boolean
  // Under the decision while leaf photos can't diagnose this crop (no model in diagnosis/crops.ts).
  photoNote: string | null
  // Whether the ledger may count weeks without danger as calendar sprays saved. Only where the
  // farmers' usual habit is known to be one spray a week.
  calendarBaseline: boolean
  // The SMS alert after "Crop Guardian: কাল থেকে ". The whole SMS must stay one Bengali SMS (≤ 70).
  smsWarning: string
  decision: Record<Risk, string>
  assess: (hourly: HourlyForecast, today?: string) => RiskAssessment
  // Every day's risk in the data, for the ledger.
  classify: (hourly: HourlyForecast) => StripDay[]
}

const strip = (days: StripDay[]): StripDay[] => days.map(({ date, risk }) => ({ date, risk }))

export const CROPS: Record<CropId, CropSpec> = {
  potato: {
    nameBn: 'আলু',
    ofBn: 'আলুর',
    diseaseBn: 'ধসা',
    riskTitle: 'আজকের ধসা রোগের ঝুঁকি',
    offSeasonTitle: 'এখন ধসা রোগের মৌসুম নয়',
    plantedQuestion: 'আলু কবে লাগিয়েছেন?',
    startPhrase: 'চারা গজালে',
    afterHarvest: 'ফসল তোলার সময় পেরিয়ে গেছে। নতুন আলু লাগালে তারিখ দিন।',
    experimental: false,
    photoNote: null,
    calendarBaseline: true,
    smsWarning: 'আলুতে নাবি ধসার ঝুঁকি। আজই পাতা দেখুন।',
    decision: DECISION,
    assess: assessRisk,
    classify: (hourly) => strip(classifyDays(summarizeDays(hourly))),
  },
  paddy: {
    nameBn: 'ধান',
    ofBn: 'ধানের',
    diseaseBn: 'ব্লাস্ট',
    riskTitle: 'আজকের ব্লাস্ট রোগের ঝুঁকি',
    offSeasonTitle: 'এখন ব্লাস্ট রোগের মৌসুম নয়',
    plantedQuestion: 'ধান কবে রোপণ করেছেন?',
    startPhrase: 'চারা লেগে গেলে',
    afterHarvest: 'ফসল তোলার সময় পেরিয়ে গেছে। নতুন ধান রুইলে তারিখ দিন।',
    experimental: true,
    photoNote: 'ছবি দেখে রোগ চেনা এখন শুধু আলুর পাতায় চলে, ধানের পাতা পরে।',
    calendarBaseline: false,
    smsWarning: 'ধানে ব্লাস্ট-ঝুঁকি (পরীক্ষামূলক)। পাতা দেখুন।',
    decision: BLAST_DECISION,
    assess: assessBlast,
    classify: (hourly) => strip(classifyBlastDays(summarizeBlastDays(hourly))),
  },
}

export const cropOf = (season: SeasonId): CropSpec => CROPS[SEASONS[season].crop]

// The paddy season a transplant around `today` most likely belongs to: Boro is planted in winter
// (Nov–Feb, harvested by May), Aman in the monsoon.
export function paddySeasonFor(today: string): SeasonId {
  const month = Number(today.slice(5, 7))
  return month >= 11 || month <= 5 ? 'boro' : 'aman'
}
