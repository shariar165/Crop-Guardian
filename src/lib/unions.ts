// The unions of Shibganj upazila, Bogura, from real boundaries (built by scripts/build-unions.ts).
import { DEFAULT_LOCATION } from '@/lib/weather'
import data from './unions.json'

export type Union = {
  id: string
  nameEn: string
  nameBn: string
  // Centroid, for the weather forecast.
  lat: number
  lon: number
  // Centroid and outline in the map's SVG coordinates.
  label: [number, number]
  path: string
}

export const UNIONS = data.unions as Union[]
export const MAP_VIEWBOX = data.viewBox.join(' ')

// The farmer's union is kept in this cookie, so the server can forecast for it.
export const UNION_COOKIE = 'cg-union'

export const unionById = (id: string | undefined | null): Union | undefined => UNIONS.find((u) => u.id === id)

// Where the farmer's weather is forecast: their union, else the upazila as a whole.
export type Place = { lat: number; lon: number; name: string; union: Union | null }

export function placeOf(union: Union | undefined | null): Place {
  return union
    ? { lat: union.lat, lon: union.lon, name: `${union.nameBn}, শিবগঞ্জ`, union }
    : { ...DEFAULT_LOCATION, union: null }
}

// The farmer's union on the client (the cookie isn't httpOnly: it holds nothing private).
export function clientUnion(): Union | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${UNION_COOKIE}=([^;]*)`))
  return unionById(match ? decodeURIComponent(match[1]) : undefined)
}
