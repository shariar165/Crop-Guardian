export type Risk = 'safe' | 'watch' | 'danger'

export const RISKS: Risk[] = ['safe', 'watch', 'danger']

export const DAY_STATE: Record<Risk, { word: string; color: string }> = {
  safe: { word: 'নিরাপদ', color: '#2F6B3A' },
  watch: { word: 'সতর্ক', color: '#8A5E00' },
  danger: { word: 'বিপদ', color: '#C2412D' },
}

export type RiskView = {
  sky: string
  ink: string
  word: string
  badgeBg: string
  badgeInk: string
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
    title: 'আজ স্প্রে লাগবে না',
    accent: '#2F6B3A', accentSoft: '#DCEBDD', sunOp: 1, cloudOp: 0, fogOp: 0, rainOp: 0, noSpray: true,
  },
  watch: {
    sky: '#CDD8D4', ink: '#20343A', word: 'সতর্ক', badgeBg: '#E8B931', badgeInk: '#2B1E16',
    title: 'আজ স্প্রে লাগবে না',
    accent: '#8A5E00', accentSoft: '#F6E7B8', sunOp: 1, cloudOp: 1, fogOp: 1, rainOp: 0, noSpray: true,
  },
  danger: {
    sky: '#2C4A50', ink: '#FBF6EC', word: 'বিপদ', badgeBg: '#C2412D', badgeInk: '#FFFFFF',
    title: '২ দিনের মধ্যে স্প্রে করুন',
    accent: '#C2412D', accentSoft: '#F5D9D2', sunOp: 0, cloudOp: 1, fogOp: 1, rainOp: 1, noSpray: false,
  },
}

// The default cost of one spray (medicine + labour); the farmer can change it on the ledger.
export const SPRAY_COST = 800

export function formatTaka(n: number): string {
  return '৳' + n.toLocaleString('bn-BD', { useGrouping: true })
}
