export type Risk = 'safe' | 'watch' | 'danger'

export const RISKS: Risk[] = ['safe', 'watch', 'danger']

// The ?risk= demo override; undefined means "use the live forecast".
export function parseRiskOverride(value: string | string[] | undefined): Risk | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return RISKS.includes(v as Risk) ? (v as Risk) : undefined
}

// The ?replay= date as given (validated by the caller); undefined when absent or empty.
export function parseReplay(value: string | string[] | undefined): string | undefined {
  const v = (Array.isArray(value) ? value[0] : value)?.trim()
  return v || undefined
}

// A real Hutton period at Shibganj (14–16 Jan 2026), found by scripts/find-hutton-periods.ts.
export const REPLAY_DEMO_DATE = '2026-01-14'

export const DAY_STATE: Record<Risk, { word: string; color: string }> = {
  safe: { word: 'নিরাপদ', color: '#2F6B3A' },
  watch: { word: 'সতর্ক', color: '#8A5E00' },
  danger: { word: 'বিপদ', color: '#C2412D' },
}

// Sample 5-day strips for the ?risk= demos and the offline fallback.
export const FORECAST: Record<Risk, Risk[]> = {
  safe: ['safe', 'safe', 'safe', 'safe', 'watch'],
  watch: ['watch', 'watch', 'danger', 'danger', 'watch'],
  danger: ['danger', 'danger', 'danger', 'watch', 'watch'],
}

export type RiskView = {
  sky: string
  ink: string
  word: string
  badgeBg: string
  badgeInk: string
  sub: string
  title: string
  accent: string
  accentSoft: string
  sunOp: number
  cloudOp: number
  fogOp: number
  rainOp: number
  noSpray: boolean
}

export const RISK_VIEW: Record<Risk, RiskView> = {
  safe: {
    sky: '#D9E9DF', ink: '#1E3A2A', word: 'নিরাপদ', badgeBg: '#2F6B3A', badgeInk: '#FFFFFF',
    sub: 'আবহাওয়া শুকনো, রোগ ছড়ানোর সম্ভাবনা কম',
    title: 'আজ স্প্রে লাগবে না',
    accent: '#2F6B3A', accentSoft: '#DCEBDD', sunOp: 1, cloudOp: 0, fogOp: 0, rainOp: 0, noSpray: true,
  },
  watch: {
    sky: '#CDD8D4', ink: '#20343A', word: 'সতর্ক', badgeBg: '#E8B931', badgeInk: '#2B1E16',
    sub: 'ভোরে কুয়াশা, বাতাসে আর্দ্রতা বাড়ছে',
    title: 'আজ স্প্রে লাগবে না',
    accent: '#8A5E00', accentSoft: '#F6E7B8', sunOp: 1, cloudOp: 1, fogOp: 1, rainOp: 0, noSpray: true,
  },
  danger: {
    sky: '#2C4A50', ink: '#FBF6EC', word: 'বিপদ', badgeBg: '#C2412D', badgeInk: '#FFFFFF',
    sub: 'টানা ৩ দিন ঘন কুয়াশা আর গুঁড়ি বৃষ্টি',
    title: '২ দিনের মধ্যে স্প্রে করুন',
    accent: '#C2412D', accentSoft: '#F5D9D2', sunOp: 0, cloudOp: 1, fogOp: 1, rainOp: 1, noSpray: false,
  },
}

export type CandidateId = 'late' | 'early' | 'nutri'

export const CANDIDATES: { id: CandidateId; name: string; en: string; sign: string }[] = [
  { id: 'late', name: 'নাবি ধসা', en: 'Late blight', sign: 'পানিভেজা বাদামি দাগ, কিনারায় ফ্যাকাশে বলয়' },
  { id: 'early', name: 'আগাম ধসা', en: 'Early blight', sign: 'গোল দাগের ভেতর চাকতির মতো রিং' },
  { id: 'nutri', name: 'পুষ্টির ঘাটতি', en: 'Nutrient deficiency', sign: 'পাতার কিনারা হলুদ বা বাদামি হয়ে যাওয়া' },
]

export type LedgerEntry = {
  day: number
  note: string
  action: string
  kind: 'saved' | 'sprayed'
  icon: 'check' | 'spray' | 'warn' | 'camera'
  amount?: number
}

export const SPRAY_COST = 800

// Shown on the Ledger until the farmer saves a real planting date.
export const SAMPLE_DAYS_SINCE_PLANTING = 52

export const LEDGER: LedgerEntry[] = [
  { day: 44, note: 'ঝুঁকি কম', action: 'স্প্রে লাগেনি', kind: 'saved', icon: 'check', amount: SPRAY_COST },
  { day: 36, note: 'নাবি ধসা নিশ্চিত', action: 'স্প্রে করেছেন · কর্মকর্তা যাচাই করেছেন', kind: 'sprayed', icon: 'spray' },
  { day: 29, note: 'বিপদ সংকেত, ২ দিন আগে জানানো', action: 'স্প্রে করেছেন', kind: 'sprayed', icon: 'warn' },
  { day: 21, note: 'সতর্কতা, ছবিতে পাতা সুস্থ', action: 'স্প্রে লাগেনি', kind: 'saved', icon: 'camera', amount: SPRAY_COST },
  { day: 12, note: 'ঝুঁকি কম', action: 'স্প্রে লাগেনি', kind: 'saved', icon: 'check', amount: SPRAY_COST },
]

export const SAVED_TOTAL = LEDGER.reduce((sum, e) => sum + (e.amount ?? 0), 0)
export const SAVED_COUNT = LEDGER.filter((e) => e.kind === 'saved').length
export const SPRAYED_COUNT = LEDGER.filter((e) => e.kind === 'sprayed').length

export function formatTaka(n: number): string {
  return '৳' + n.toLocaleString('bn-BD', { useGrouping: true })
}

export type MapPeriod = 'week' | 'month'

export type UnionArea = { name: string; risk: Risk; cases: number }

// Zone order matches the polygons in <RiskMap/>.
export const MAP_DATA: Record<MapPeriod, { label: string; unions: UnionArea[]; caseLabel: string }> = {
  week: {
    label: 'এই সপ্তাহ',
    caseLabel: 'নিশ্চিত কেস এই সপ্তাহে',
    unions: [
      { name: 'কিচক', risk: 'danger', cases: 4 },
      { name: 'আটমূল', risk: 'watch', cases: 2 },
      { name: 'শিবগঞ্জ', risk: 'danger', cases: 5 },
      { name: 'মোকামতলা', risk: 'watch', cases: 1 },
      { name: 'ময়দানহাট্টা', risk: 'safe', cases: 0 },
      { name: 'দেউলী', risk: 'safe', cases: 0 },
    ],
  },
  month: {
    label: 'গত মাস',
    caseLabel: 'নিশ্চিত কেস গত মাসে',
    unions: [
      { name: 'কিচক', risk: 'watch', cases: 3 },
      { name: 'আটমূল', risk: 'safe', cases: 0 },
      { name: 'শিবগঞ্জ', risk: 'danger', cases: 6 },
      { name: 'মোকামতলা', risk: 'watch', cases: 2 },
      { name: 'ময়দানহাট্টা', risk: 'watch', cases: 1 },
      { name: 'দেউলী', risk: 'safe', cases: 0 },
    ],
  },
}
