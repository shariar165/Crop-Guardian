// Builds the areas the app covers: the potato districts of the Rangpur and Rajshahi divisions and
// Munshiganj, down to their unions, with real boundaries for the map and centroids for the forecast.
//   - src/lib/geo/areas.json: division → district → upazila → union, names and centroids, no shapes.
//   - src/lib/geo/shapes/<upazilaId>.json: each upazila's unions drawn for the map.
//   - src/lib/geo/shapes/index.ts: a loader per upazila, so the server only reads the one it needs.
//
// Sources (download once, anywhere outside the repo):
//   - geoBoundaries BGD ADM4 (unions), simplified:
//     https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM4/geoBoundaries-BGD-ADM4_simplified.geojson
//   - OCHA COD-AB admin 3 (upazilas, with their district and division), bgd_admin3.geojson from
//     https://data.humdata.org/dataset/cod-ab-bgd (bgd_admin_boundaries.geojson.zip)
//   - Bengali names: districts.json, upazilas.json and unions.json from
//     https://github.com/nuhil/bangladesh-geocode (MIT)
// A union belongs to the upazila its centroid lies in. Bengali names are matched on the English
// spelling within the same upazila; any name that doesn't match must be added to BN by hand
// (checked against Banglapedia), and the build stops until it is.
//
// Run: npx tsx scripts/build-areas.ts <adm4.geojson> <bgd_admin3.geojson> <bangladesh-geocode dir>
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = 'src/lib/geo'
const SHAPES_DIR = join(OUT_DIR, 'shapes')
// The map's SVG width; the height follows the upazila's shape. MapView's offsets are tuned to it.
const VIEW_WIDTH = 338
const PAD = 6

const DIVISIONS: { pcode: string; id: string; nameBn: string }[] = [
  { pcode: 'BD55', id: 'rangpur', nameBn: 'রংপুর বিভাগ' },
  { pcode: 'BD50', id: 'rajshahi', nameBn: 'রাজশাহী বিভাগ' },
  { pcode: 'BD30', id: 'dhaka', nameBn: 'ঢাকা বিভাগ' },
]

// OCHA district pcode → id. Every district of Rangpur and Rajshahi divisions, and Munshiganj.
const DISTRICTS: Record<string, string> = {
  BD5585: 'rangpur',
  BD5527: 'dinajpur',
  BD5594: 'thakurgaon',
  BD5577: 'panchagarh',
  BD5573: 'nilphamari',
  BD5552: 'lalmonirhat',
  BD5549: 'kurigram',
  BD5532: 'gaibandha',
  BD5081: 'rajshahi',
  BD5070: 'chapainawabganj',
  BD5064: 'naogaon',
  BD5069: 'natore',
  BD5010: 'bogura',
  BD5038: 'joypurhat',
  BD5088: 'sirajganj',
  BD5076: 'pabna',
  BD3059: 'munshiganj',
}

// City corporations are wards, not unions, and grow no potato.
const SKIP_UPAZILA = /City Corporation/
const CITY_WARD = /^Ward No/

// Upazila spellings too far apart to match on their own: OCHA name → bangladesh-geocode name.
const UPAZILA_ALIAS: Record<string, string> = {
  'Rajibpur': 'Charrajibpur',
  'Bogura Sadar': 'Bogra Sadar',
  'Tentulia': 'Tetulia',
  'Roumari': 'Rowmari',
  'Dupchachia': 'Dupchanchia',
  'Ishwardi': 'Ishurdi',
  'Louhajang': 'Louhajanj',
}

// Misspellings in bangladesh-geocode's Bengali names.
const BN_FIX: Record<string, string> = {
  'দুপচাচিঁয়া': 'দুপচাঁচিয়া',
  'মুন্সিগঞ্জ': 'মুন্সীগঞ্জ',
  'মুন্সিগঞ্জ সদর': 'মুন্সীগঞ্জ সদর',
}
// The sources mix precomposed য়/ড় with য/ড + nukta; NFC makes one spelling of each name.
const nfc = (s: string) => s.trim().normalize('NFC')
const fixBn = (s: string) => {
  const n = nfc(s)
  return Object.entries(BN_FIX).find(([bad]) => nfc(bad) === n)?.[1].normalize('NFC') ?? n
}

// Bengali names the sources don't give or spell differently, keyed by `${upazilaId}/${ADM4 name}`.
// [id, Bengali name]; the id is optional and kept for Shibganj (Bogura), whose union ids predate
// the other districts and are still in cookies and saved cases.
const BN: Record<string, [string | null, string]> = {
  'bogura-shibganj/Atmul': ['atmul', 'আটমূল'],
  'bogura-shibganj/Bihar': ['bihar', 'বিহার'],
  'bogura-shibganj/Buriganj': ['buriganj', 'বুড়িগঞ্জ'],
  'bogura-shibganj/Deuli': ['deuli', 'দেউলী'],
  'bogura-shibganj/Kichak': ['kichak', 'কিচক'],
  'bogura-shibganj/Maidanhata': ['maidanhata', 'ময়দানহাট্টা'],
  'bogura-shibganj/Majhihatta': ['majhihatta', 'মাঝিহট্ট'],
  'bogura-shibganj/Mokamtala': ['mokamtala', 'মোকামতলা'],
  'bogura-shibganj/Pirab': ['pirab', 'পীরব'],
  'bogura-shibganj/Roynagar': ['roynagar', 'রায়নগর'],
  'bogura-shibganj/Saidpur': ['saidpur', 'সৈয়দপুর'],
  'bogura-shibganj/Shibganj': ['shibganj', 'শিবগঞ্জ'],
  'bogura-shibganj/Shibganj Paurashava': ['shibganj-pourashava', 'শিবগঞ্জ পৌরসভা'],
  // The ADM4 spelling is too far from bangladesh-geocode's, or a town isn't in it. Checked by hand;
  // where no Bengali source was found, the English name is written in Bengali letters.
  'rangpur-badarganj/Badarganj': [null, 'বদরগঞ্জ'],
  'rangpur-gangachara/Lakshmitari': [null, 'লক্ষীটারী'],
  'rangpur-kaunia/Kaunia Bala Para': [null, 'বালাপাড়া'],
  'rangpur-pirgachha/Chhaola': [null, 'ছাওলা'],
  'rangpur-sadar/Khaleya': [null, 'খলেয়া'],
  'rangpur-taraganj/Kursha': [null, 'কুর্শা'],
  'dinajpur-bochaganj/Chhatail': [null, 'ছাতইল'],
  'dinajpur-bochaganj/Mushidhat': [null, 'মুর্শিদহাট'],
  'dinajpur-bochaganj/Setabganj Paurashava': [null, 'সেতাবগঞ্জ পৌরসভা'],
  'dinajpur-chirirbandar/Saintara': [null, 'সাইতারা'],
  'dinajpur-chirirbandar/Tentulia': [null, 'তেতুলিয়া'],
  'dinajpur-fulbari/Kazihal': [null, 'কাজীহাল'],
  'dinajpur-kaharole/Targaon': [null, 'তারগাঁও'],
  'thakurgaon-sadar/Akcha': [null, 'আকচা'],
  'panchagarh-boda/Benghari Banagram': [null, 'বেংহারী বনগ্রাম'],
  'panchagarh-debiganj/Hazradanga': [null, 'চেংঠী হাজরা ডাঙ্গা'],
  'panchagarh-tentulia/Bhojanpur': [null, 'ভজনপুর'],
  'panchagarh-tentulia/Bhojanpur Debnagar': [null, 'দেবনগর'],
  'panchagarh-tentulia/Tirnaihat': [null, 'তিরনইহাট'],
  'nilphamari-jaldhaka/Kanthali': [null, 'কাঠালী'],
  'lalmonirhat-hatibandha/Baura': [null, 'বাউড়া'],
  'kurigram-phulbari/Naodanga': [null, 'নাওডাঙ্গা'],
  'kurigram-roumari/Dantbhanga': [null, 'দাঁতভাঙ্গা'],
  'kurigram-roumari/Raumari': [null, 'রৌমারী'],
  'kurigram-ulipur/Gunaigachh': [null, 'গুনাইগাছ'],
  'gaibandha-sadullapur/Khurda Kamarpur': [null, 'খোদকোমরপুর'],
  'rajshahi-bagmara/Bhabanigonj Paurashava': [null, 'ভবানীগঞ্জ পৌরসভা'],
  'rajshahi-bagmara/Dwippur': [null, 'দ্বীপপুর'],
  'rajshahi-bagmara/Maria': [null, 'মাড়িয়া'],
  'rajshahi-bagmara/Tahirpur Paurashava': [null, 'তাহেরপুর পৌরসভা'],
  'rajshahi-charghat/Katakhali Paurashava': [null, 'কাটাখালী পৌরসভা'],
  'rajshahi-durgapur/Dharmapur (Pananagar)': [null, 'পানানগর'],
  'rajshahi-godagari/Char Ashariadaha': [null, 'চর আষাড়িয়াদহ'],
  'rajshahi-godagari/Deopara': [null, 'দেওপাড়া'],
  'rajshahi-godagari/Kakanhat Paurashava': [null, 'কাকনহাট পৌরসভা'],
  'rajshahi-mohanpur/Kesharhat Paurashava': [null, 'কেশরহাট পৌরসভা'],
  'rajshahi-paba/Noahata Paurashava': [null, 'নওহাটা পৌরসভা'],
  'rajshahi-puthia/Brahmapur': [null, 'ব্রহ্মপুর'],
  'rajshahi-puthia/Jeopara': [null, 'জিউপাড়া'],
  'rajshahi-tanore/Mundumala Paurashava': [null, 'মুন্ডুমালা পৌরসভা'],
  'rajshahi-tanore/Pachandar': [null, 'পাঁচন্দর'],
  'chapainawabganj-sadar/Chapai Nababganj Paurashava': [null, 'চাঁপাইনবাবগঞ্জ পৌরসভা'],
  'chapainawabganj-sadar/Dhainagar': [null, 'ধাইনগর'],
  'chapainawabganj-shibganj/Naya Naobhanga': [null, 'নয়ালাভাঙ্গা'],
  'naogaon-atrai/Bhopara': [null, 'ভোঁপাড়া'],
  'naogaon-manda/Kanso Para': [null, 'কাঁশোপাড়া'],
  'naogaon-manda/Mainani': [null, 'মৈনম'],
  'naogaon-manda/Tentulia': [null, 'তেঁতুলিয়া'],
  'naogaon-porsha/Tentulia': [null, 'তেঁতুলিয়া'],
  'naogaon-raninagar/Raninagar': [null, 'খট্টেশ্বর রাণীনগর'],
  'naogaon-sapahar/Aihai': [null, 'আইহাই'],
  'natore-baraigram/Banpara Paurashava': [null, 'বনপাড়া পৌরসভা'],
  'natore-lalpur/Arjunpur Boromhati': [null, 'অর্জুনপুর বরমহাটী'],
  'natore-lalpur/Gopalpur (Lalpur) Paurashav': [null, 'গোপালপুর পৌরসভা'],
  'natore-lalpur/Walia': [null, 'ওয়ালিয়া'],
  'natore-naldanga/Bipra Belgharia': [null, 'বিপ্রবেলঘড়িয়া'],
  'natore-naldanga/Khajuria': [null, 'খাজুরা'],
  'natore-naldanga/Madhnagar': [null, 'মাধনগর'],
  'natore-naldanga/Piprul': [null, 'পিপরুল'],
  'natore-sadar/Kafuria': [null, 'কাফুরিয়া'],
  'bogura-adamdighi/Champapur': [null, 'চাঁপাপুর'],
  'bogura-sadar/Bogra Paurashava': [null, 'বগুড়া পৌরসভা'],
  'bogura-dhunat/Chaukibari': [null, 'চৌকিবাড়ী'],
  'bogura-kahaloo/Kalai Majh Para': [null, 'কালাই'],
  'bogura-kahaloo/Urail': [null, 'মুরইল'],
  'bogura-sariakandi/Fulbari': [null, 'হাটফুলবাড়ী'],
  'bogura-shajahanpur/Sultanganj (Part)': [null, 'সুলতানগঞ্জ'],
  'joypurhat-khetlal/Batara': [null, 'বড়তারা'],
  'joypurhat-khetlal/Khetlal': [null, 'ক্ষেতলাল'],
  'sirajganj-rayganj/Royganj Paurashava': [null, 'রায়গঞ্জ পৌরসভা'],
  'sirajganj-sadar/Chhangachha': [null, 'ছোনগাছা'],
  'sirajganj-sadar/Kaoakola': [null, 'কাওয়াখোলা'],
  'sirajganj-sadar/Mechhra': [null, 'মেছড়া'],
  'sirajganj-ullapara/Salap': [null, 'সলপ'],
  'pabna-atgharia/Atgharia Paurashava': [null, 'আটঘরিয়া পৌরসভা'],
  'pabna-bera/Masundia': [null, 'মাসুমদিয়া'],
  'pabna-ishwardi/Ishwardi Paurashava': [null, 'ঈশ্বরদী পৌরসভা'],
  'pabna-bhangura/Munotosh': [null, 'মন্ডতোষ'],
  'pabna-santhia/Ataikola': [null, 'আর-আতাইকুলা'],
  'pabna-santhia/Karanja': [null, 'করমজা'],
  'pabna-sujanagar/Sujanagar': [null, 'সুজানগর'],
  'munshiganj-sadar/Mirkadim Paurashava': [null, 'মিরকাদিম পৌরসভা'],
  'munshiganj-tongibari/Arial': [null, 'আড়িয়ল'],
}

type Ring = [number, number][]
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] }
type Feature = { properties: Record<string, unknown>; geometry: Geometry }
type Named = { id: string; name: string; bn_name: string }

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

const readFeatures = (path: string): Feature[] => (JSON.parse(readFileSync(path, 'utf8')) as { features: Feature[] }).features

// bangladesh-geocode files are phpMyAdmin exports: the rows are in the one "table" entry.
// Some union names carry the end of their website's name ("Ramnathpurupb", "Kurshaupk").
function readGeocode(dir: string, name: string): (Named & Record<string, string>)[] {
  const rows = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as { type: string; data?: (Named & Record<string, string>)[] }[]
  return rows
    .find((r) => r.type === 'table')!
    .data!.map((r) => ({ ...r, name: r.name.trim().replace(/(?<=\w{4})up[a-z]$/, ''), bn_name: fixBn(r.bn_name) }))
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// English spellings of the same Bengali name vary a lot (Pirgonj/Pirganj, Nawabganj/Nababganj,
// Syedpur/Saidpur), so names are compared by their consonants.
function skeleton(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b(union|paurashava|paurashav|pourashava|upazila|sadar)\b/g, '')
    .replace(/[^a-z]/g, '')
    .replace(/gonj/g, 'ganj')
    .replace(/x/g, 'ks')
    .replace(/ph/g, 'f')
    .replace(/h/g, '')
    .replace(/w|v/g, 'b')
    .replace(/z/g, 'j')
    .replace(/q/g, 'k')
    .replace(/[aeiouy]/g, '')
    .replace(/(.)\1+/g, '$1')
}

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

// The one candidate whose name matches: the same skeleton, or unless strict a single closest one,
// at most one consonant away (two for long names). Ambiguous or distant names return null.
function match<T extends { name: string }>(name: string, candidates: T[], strict = false): T | null {
  const k = skeleton(name)
  if (!k) return null
  const same = candidates.filter((c) => skeleton(c.name) === k)
  if (same.length === 1) return same[0]
  if (same.length > 1) return same.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
  if (strict) return null
  const scored = candidates.map((c) => ({ c, d: distance(k, skeleton(c.name)) })).sort((x, y) => x.d - y.d)
  const most = k.length >= 8 ? 2 : k.length >= 5 ? 1 : 0
  if (scored[0] && scored[0].d <= most && (scored.length === 1 || scored[1].d > scored[0].d)) return scored[0].c
  return null
}

function projector(features: Feature[]) {
  const points = features.flatMap((f) => outerRings(f.geometry).flat())
  const lons = points.map((p) => p[0])
  const lats = points.map((p) => p[1])
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
  // Equirectangular, scaled by cos(latitude) so the shape isn't stretched.
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const scale = (VIEW_WIDTH - 2 * PAD) / ((maxLon - minLon) * kx)
  const viewHeight = Math.ceil((maxLat - minLat) * scale + 2 * PAD)
  const project = ([lon, lat]: [number, number]): [number, number] => [
    Math.round(((lon - minLon) * kx * scale + PAD) * 10) / 10,
    Math.round(((maxLat - lat) * scale + PAD) * 10) / 10,
  ]
  return { viewBox: [0, 0, VIEW_WIDTH, viewHeight], project }
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4

const [adm4Path, adm3Path, geocodeDir] = process.argv.slice(2)
if (!adm4Path || !adm3Path || !geocodeDir) {
  console.error('Usage: npx tsx scripts/build-areas.ts <adm4.geojson> <bgd_admin3.geojson> <bangladesh-geocode dir>')
  process.exit(1)
}

const gDistricts = readGeocode(geocodeDir, 'districts')
const gUpazilas = readGeocode(geocodeDir, 'upazilas')
const gUnions = readGeocode(geocodeDir, 'unions')
const adm3 = readFeatures(adm3Path).filter((f) => DISTRICTS[String(f.properties.adm2_pcode)] && !SKIP_UPAZILA.test(String(f.properties.adm3_name)))
const adm4 = readFeatures(adm4Path).map((f) => ({ f, c: centroid(f.geometry) }))

const problems: string[] = []
const fuzzy: string[] = []
const note = (from: string, to: string) => {
  if (from.toLowerCase() !== to.toLowerCase()) fuzzy.push(`${from} → ${to}`)
}

type UnionOut = { id: string; nameBn: string; nameEn: string; lat: number; lon: number }
type UpazilaOut = { id: string; nameBn: string; nameEn: string; lat: number; lon: number; unions: UnionOut[] }
type DistrictOut = { id: string; nameBn: string; nameEn: string; upazilas: UpazilaOut[] }

const districts: (DistrictOut & { division: string })[] = []
const shapes: Record<string, { viewBox: number[]; unions: { id: string; label: [number, number]; path: string }[] }> = {}
const claimed = new Set<Feature>()

for (const [pcode, districtId] of Object.entries(DISTRICTS)) {
  const upas = adm3.filter((f) => f.properties.adm2_pcode === pcode)
  const nameEn = String(upas[0]?.properties.adm2_name)
  const gDistrict = match(districtId, gDistricts)
  if (!gDistrict) {
    problems.push(`district ${districtId}: no Bengali name`)
    continue
  }
  const district: DistrictOut & { division: string } = {
    id: districtId,
    nameBn: gDistrict.bn_name,
    nameEn: gDistrict.name,
    division: String(upas[0].properties.adm1_pcode),
    upazilas: [],
  }
  note(nameEn, gDistrict.name)

  for (const upa of upas) {
    const upaName = String(upa.properties.adm3_name)
    const upaSlug = slug(upaName)
    const upazilaId = upaSlug.startsWith(`${districtId}-`) ? upaSlug : `${districtId}-${upaSlug}`
    const candidates = gUpazilas.filter((u) => u.district_id === gDistrict.id)
    const alias = UPAZILA_ALIAS[upaName]
    const gUpa = alias ? candidates.find((u) => u.name === alias) : match(upaName, candidates)
    if (!gUpa) {
      problems.push(`upazila ${upazilaId} (${upaName}): no Bengali name`)
      continue
    }
    note(upaName, gUpa.name)

    const rings = outerRings(upa.geometry)
    const inside = adm4.filter(({ f, c }) => !claimed.has(f) && rings.some((r) => inRing(c, r))).map(({ f }) => f)
    inside.forEach((f) => claimed.add(f))
    const gUnionsHere = gUnions.filter((u) => u.upazilla_id === gUpa.id)

    const unions: (UnionOut & { f: Feature })[] = []
    const ids = new Set<string>()
    const used = new Set<Named>()
    const missing: string[] = []
    for (const f of inside) {
      const en = String(f.properties.shapeName)
      if (CITY_WARD.test(en)) continue
      const fixed = BN[`${upazilaId}/${en}`]
      let nameBn = fixed && nfc(fixed[1])
      const isTown = /Paurashav/.test(en)
      if (!nameBn && isTown) {
        // A town: named after its upazila, its district, one of its unions or another upazila, in that
        // order. Only exact spellings, since a town's name is often close to an unrelated upazila's.
        const stem = en.replace(/\s*\(.*?\)|\s*Paurashava?$/g, '')
        const town = stem
          ? [[gUpa], [gDistrict], gUnionsHere, candidates].reduce<Named | null>((found, list) => found ?? match(stem, list, true), null)
          : gUpa
        if (town) {
          nameBn = `${town.bn_name.replace(/\s*সদর$/, '')} পৌরসভা`
          if (stem) note(stem, town.name)
        }
      }
      if (!nameBn && !isTown) {
        const u = match(en, gUnionsHere)
        if (u) {
          used.add(u)
          nameBn = u.bn_name.trim()
          note(en, u.name)
        }
      }
      if (!nameBn) {
        missing.push(en)
        continue
      }
      let id = `${upazilaId}.${fixed?.[0] ?? slug(en)}`
      for (let n = 2; ids.has(id); n++) id = `${upazilaId}.${slug(en)}-${n}`
      ids.add(id)
      const [lon, lat] = centroid(f.geometry)
      unions.push({ id, nameBn: nfc(nameBn), nameEn: en, lat: round4(lat), lon: round4(lon), f })
    }
    if (missing.length) {
      const left = gUnionsHere.filter((u) => !used.has(u)).map((u) => `${u.name}=${u.bn_name}`)
      problems.push(`${upazilaId} (${gUpa.bn_name}): ${missing.join(', ')}  [unused: ${left.join(', ')}]`)
    }
    if (unions.length === 0) {
      problems.push(`upazila ${upazilaId}: no unions`)
      continue
    }
    unions.sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'))

    const { viewBox, project } = projector(unions.map((u) => u.f))
    shapes[upazilaId] = {
      viewBox,
      unions: unions.map((u) => ({
        id: u.id,
        label: project([u.lon, u.lat]),
        path: outerRings(u.f.geometry)
          .map((ring) => 'M' + ring.map((p) => project(p).join(',')).join('L') + 'Z')
          .join(''),
      })),
    }
    const [lon, lat] = centroid(upa.geometry)
    district.upazilas.push({
      id: upazilaId,
      nameBn: gUpa.bn_name,
      nameEn: upaName,
      lat: round4(lat),
      lon: round4(lon),
      unions: unions.map((u) => ({ id: u.id, nameBn: u.nameBn, nameEn: u.nameEn, lat: u.lat, lon: u.lon })),
    })
  }
  district.upazilas.sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'))
  districts.push(district)
}

if (fuzzy.length) console.log(`Matched by spelling (check):\n  ${fuzzy.join('\n  ')}`)
if (problems.length) {
  console.error(`\n${problems.length} problems; add the names to BN or UPAZILA_ALIAS:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

const out = {
  source:
    'geoBoundaries BGD ADM4 (gbOpen, 9469f09) unions, by centroid in OCHA COD-AB admin 3 (BBS boundaries); Bengali names from nuhil/bangladesh-geocode',
  divisions: DIVISIONS.map((d) => ({
    id: d.id,
    nameBn: d.nameBn,
    districts: districts.filter((x) => x.division === d.pcode).map((x) => ({ id: x.id, nameBn: x.nameBn, nameEn: x.nameEn, upazilas: x.upazilas })),
  })),
}

mkdirSync(SHAPES_DIR, { recursive: true })
for (const f of readdirSync(SHAPES_DIR)) rmSync(join(SHAPES_DIR, f))
writeFileSync(join(OUT_DIR, 'areas.json'), JSON.stringify(out) + '\n')
for (const [id, s] of Object.entries(shapes)) writeFileSync(join(SHAPES_DIR, `${id}.json`), JSON.stringify(s) + '\n')
const ids = Object.keys(shapes).sort()
writeFileSync(
  join(SHAPES_DIR, 'index.ts'),
  `// Generated by scripts/build-areas.ts. One loader per upazila, so a page reads only the map it draws.\n` +
    `// The JSON is typed loosely (label: number[]); src/lib/shapes.ts gives it the UpazilaShapes type.\n` +
    `export const SHAPES: Record<string, () => Promise<{ default: unknown }>> = {\n` +
    ids.map((id) => `  '${id}': () => import('./${id}.json'),\n`).join('') +
    `}\n`,
)

for (const d of districts) console.log(`${d.nameEn.padEnd(16)} ${String(d.upazilas.length).padStart(3)} upazilas ${String(d.upazilas.reduce((n, u) => n + u.unions.length, 0)).padStart(4)} unions`)
console.log(`Wrote ${OUT_DIR}/areas.json and ${ids.length} upazila maps`)
