// Builds src/lib/unions.json: the unions of Shibganj upazila (Bogura), with their real boundaries
// drawn for the map and their centroids for the weather forecast.
//
// Sources (download once, anywhere outside the repo):
//   - geoBoundaries BGD ADM4 (unions), simplified:
//     https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM4/geoBoundaries-BGD-ADM4_simplified.geojson
//   - OCHA COD-AB admin 3 (upazilas), bgd_admin3.geojson from
//     https://data.humdata.org/dataset/cod-ab-bgd (bgd_admin_boundaries.geojson.zip)
// A union belongs to the upazila when its centroid lies inside the upazila's polygon.
//
// Run: npx tsx scripts/build-unions.ts <adm4.geojson> <bgd_admin3.geojson>
import { readFileSync, writeFileSync } from 'node:fs'

const OUT = 'src/lib/unions.json'
const UPAZILA_PCODE = 'BD50100094' // Shibganj, Bogura
// The map's SVG width; the height follows the upazila's shape.
const VIEW_WIDTH = 338
const PAD = 6

// geoBoundaries' English name → [id, Bengali name].
const NAMES: Record<string, [string, string]> = {
  Atmul: ['atmul', 'আটমূল'],
  Bihar: ['bihar', 'বিহার'],
  Buriganj: ['buriganj', 'বুড়িগঞ্জ'],
  Deuli: ['deuli', 'দেউলী'],
  Kichak: ['kichak', 'কিচক'],
  Maidanhata: ['maidanhata', 'ময়দানহাট্টা'],
  Majhihatta: ['majhihatta', 'মাঝিহট্ট'],
  Mokamtala: ['mokamtala', 'মোকামতলা'],
  Pirab: ['pirab', 'পীরব'],
  Roynagar: ['roynagar', 'রায়নগর'],
  Saidpur: ['saidpur', 'সৈয়দপুর'],
  Shibganj: ['shibganj', 'শিবগঞ্জ'],
  'Shibganj Paurashava': ['shibganj-pourashava', 'শিবগঞ্জ পৌরসভা'],
}

type Ring = [number, number][]
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] }
type Feature = { properties: Record<string, unknown>; geometry: Geometry }

const outerRings = (g: Geometry): Ring[] => (g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]))

function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false
  for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
    const [xi, yi] = ring[i]
    const [xk, yk] = ring[k]
    if (yi > y !== yk > y && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) inside = !inside
  }
  return inside
}

// Area-weighted centroid of the outer rings, as [lon, lat].
function centroid(g: Geometry): [number, number] {
  let a = 0
  let cx = 0
  let cy = 0
  for (const ring of outerRings(g)) {
    for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
      const f = ring[k][0] * ring[i][1] - ring[i][0] * ring[k][1]
      a += f
      cx += (ring[k][0] + ring[i][0]) * f
      cy += (ring[k][1] + ring[i][1]) * f
    }
  }
  return [cx / (3 * a), cy / (3 * a)]
}

function readFeatures(path: string): Feature[] {
  return (JSON.parse(readFileSync(path, 'utf8')) as { features: Feature[] }).features
}

const [adm4Path, adm3Path] = process.argv.slice(2)
if (!adm4Path || !adm3Path) {
  console.error('Usage: npx tsx scripts/build-unions.ts <adm4.geojson> <bgd_admin3.geojson>')
  process.exit(1)
}

const upazila = readFeatures(adm3Path).find((f) => f.properties.adm3_pcode === UPAZILA_PCODE)
if (!upazila) throw new Error(`Upazila ${UPAZILA_PCODE} not found`)

const unions = readFeatures(adm4Path).filter((f) => {
  const c = centroid(f.geometry)
  return outerRings(upazila.geometry).some((ring) => inRing(c, ring))
})
const unknown = unions.map((f) => String(f.properties.shapeName)).filter((n) => !NAMES[n])
if (unknown.length) throw new Error(`No Bengali name for: ${unknown.join(', ')}`)
if (unions.length !== Object.keys(NAMES).length) throw new Error(`Expected ${Object.keys(NAMES).length} unions, got ${unions.length}`)

// Equirectangular projection, scaled by cos(latitude) so the shape isn't stretched.
const points = unions.flatMap((f) => outerRings(f.geometry).flat())
const lons = points.map((p) => p[0])
const lats = points.map((p) => p[1])
const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
const scale = (VIEW_WIDTH - 2 * PAD) / ((maxLon - minLon) * kx)
const viewHeight = Math.ceil((maxLat - minLat) * scale + 2 * PAD)
const project = ([lon, lat]: [number, number]): [number, number] => [
  Math.round(((lon - minLon) * kx * scale + PAD) * 10) / 10,
  Math.round(((maxLat - lat) * scale + PAD) * 10) / 10,
]

const out = unions
  .map((f) => {
    const [id, nameBn] = NAMES[String(f.properties.shapeName)]
    const [lon, lat] = centroid(f.geometry)
    const path = outerRings(f.geometry)
      .map((ring) => 'M' + ring.map((p) => project(p).join(',')).join('L') + 'Z')
      .join('')
    return {
      id,
      nameEn: String(f.properties.shapeName),
      nameBn,
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
      label: project([lon, lat]),
      path,
    }
  })
  .sort((a, b) => a.id.localeCompare(b.id))

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: 'geoBoundaries BGD ADM4 (gbOpen, 9469f09); unions whose centroid is inside OCHA COD-AB BD50100094',
      viewBox: [0, 0, VIEW_WIDTH, viewHeight],
      unions: out,
    },
    null,
    1,
  ) + '\n',
)
console.log(`Wrote ${out.length} unions to ${OUT} (viewBox ${VIEW_WIDTH}×${viewHeight})`)
