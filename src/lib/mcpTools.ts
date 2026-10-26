// The parts of the MCP server (src/app/api/mcp) that don't need the network: finding a union by
// name and describing what the photo diagnosis can name. Kept here so they can be tested.
import { DIVISIONS, fullName } from '@/lib/areas'
import { CROPS } from '@/lib/crops'
import { contentOf } from '@/lib/diagnosis/content'
import { classesOf, PHOTO_CROPS, PHOTO_SPECS } from '@/lib/diagnosis/crops'

export const MAX_MATCHES = 10

const UNIONS = DIVISIONS.flatMap((v) => v.districts.flatMap((d) => d.upazilas.flatMap((u) => u.unions)))

// A union's id from its name in Bengali or English, or from its upazila's or district's name
// ("কিচক", "shibganj", "বগুড়া").
export function findUnions(query: string): { id: string; name: string; nameEn: string }[] {
  const q = query.normalize('NFC').trim().toLowerCase()
  if (!q) return []
  const exact: typeof UNIONS = []
  const partial: typeof UNIONS = []
  for (const u of UNIONS) {
    const names = [u.nameBn.normalize('NFC'), u.nameEn.toLowerCase()]
    if (names.includes(q)) exact.push(u)
    else if (names.some((n) => n.includes(q)) || fullName(u).normalize('NFC').includes(q) || u.id.includes(q)) partial.push(u)
  }
  return [...exact, ...partial].slice(0, MAX_MATCHES).map((u) => ({ id: u.id, name: fullName(u), nameEn: u.nameEn }))
}

// What the on-device models can say about a potato or paddy leaf, with the app's advice for each.
// The labels in PHOTO_SPECS are tested against each crop's model config.
export function diagnosisClasses() {
  return {
    note: 'The models run only on the phone; this server never sees photos. Every result is experimental and doses always follow the label.',
    classes: PHOTO_CROPS.flatMap((crop) =>
      classesOf(crop).flatMap((id) => {
        const c = contentOf(crop, id)
        if (!c) return []
        return [{ crop, experimental: CROPS[crop].experimental, id, nameBn: PHOTO_SPECS[crop].labelsBn[id], nameEn: c.en, sign: c.sign, steps: c.steps }]
      }),
    ),
    unknown: 'When a photo looks like nothing the model knows, the app says «চিনতে পারিনি» and suggests sending it to the agriculture officer.',
  }
}
