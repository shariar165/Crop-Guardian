// The areas the app covers: every district of the Rangpur and Rajshahi divisions and Munshiganj,
// down to their unions (built by scripts/build-areas.ts). Server-side only: the index is too big
// for the phone, which reads the farmer's place from cookies instead (src/lib/placeCookies.ts).
import { DEFAULT_LOCATION } from '@/lib/weather'
import data from './geo/areas.json'

export type Union = {
  id: string
  upazilaId: string
  nameEn: string
  nameBn: string
  // Centroid, for the weather forecast.
  lat: number
  lon: number
}

export type Upazila = Omit<Union, 'upazilaId'> & { districtId: string; unions: Union[] }
export type District = { id: string; divisionId: string; nameEn: string; nameBn: string; upazilas: Upazila[] }
export type Division = { id: string; nameBn: string; districts: District[] }

// One upazila's unions drawn for the map, in its own SVG coordinates (src/lib/shapes.ts).
export type UpazilaShapes = { viewBox: number[]; unions: { id: string; label: [number, number]; path: string }[] }

type Raw = {
  divisions: {
    id: string
    nameBn: string
    districts: (Omit<District, 'divisionId' | 'upazilas'> & { upazilas: (Omit<Upazila, 'districtId' | 'unions'> & { unions: Omit<Union, 'upazilaId'>[] })[] })[]
  }[]
}

export const DIVISIONS: Division[] = (data as Raw).divisions.map((v) => ({
  ...v,
  districts: v.districts.map((d) => ({
    ...d,
    divisionId: v.id,
    upazilas: d.upazilas.map((u) => ({ ...u, districtId: d.id, unions: u.unions.map((x) => ({ ...x, upazilaId: u.id })) })),
  })),
}))

const DISTRICTS = new Map(DIVISIONS.flatMap((v) => v.districts).map((d) => [d.id, d]))
const UPAZILAS = new Map([...DISTRICTS.values()].flatMap((d) => d.upazilas).map((u) => [u.id, u]))
const UNIONS = new Map([...UPAZILAS.values()].flatMap((u) => u.unions).map((x) => [x.id, x]))

// Shibganj, Bogura: the app's first area, and the forecast before the farmer picks theirs.
export const DEFAULT_UPAZILA_ID = 'bogura-shibganj'

export const districtById = (id: string | undefined | null): District | undefined => (id ? DISTRICTS.get(id) : undefined)
export const upazilaById = (id: string | undefined | null): Upazila | undefined => (id ? UPAZILAS.get(id) : undefined)

// Before more districts were added, union ids were bare Shibganj names ("kichak"); old cookies and
// saved cases still carry them.
export function unionById(id: string | undefined | null): Union | undefined {
  if (!id) return undefined
  return UNIONS.get(id.includes('.') ? id : `${DEFAULT_UPAZILA_ID}.${id}`)
}

export const upazilaOf = (union: Union): Upazila => UPAZILAS.get(union.upazilaId)!
export const districtOf = (upazila: Upazila): District => DISTRICTS.get(upazila.districtId)!

// "কিচক, শিবগঞ্জ, বগুড়া", for the officer, who sees cases from every district.
export function fullName(union: Union): string {
  const upazila = upazilaOf(union)
  return `${union.nameBn}, ${upazila.nameBn}, ${districtOf(upazila).nameBn}`
}

// Where the farmer's weather is forecast: their union, else Shibganj as a whole.
export type Place = { lat: number; lon: number; name: string; union: Union | null; upazila: Upazila; district: District }

export function placeOf(union: Union | undefined | null): Place {
  if (!union) {
    const upazila = UPAZILAS.get(DEFAULT_UPAZILA_ID)!
    return { ...DEFAULT_LOCATION, union: null, upazila, district: districtOf(upazila) }
  }
  const upazila = upazilaOf(union)
  return { lat: union.lat, lon: union.lon, name: `${union.nameBn}, ${upazila.nameBn}`, union, upazila, district: districtOf(upazila) }
}
