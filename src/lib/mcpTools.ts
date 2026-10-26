// The parts of the MCP server (src/app/api/mcp) that don't need the network: finding a union by
// name and describing what the photo diagnosis can name. Kept here so they can be tested.
import { DIVISIONS, fullName } from '@/lib/areas'
import { CLASS_CONTENT } from '@/lib/diagnosis/content'
import { parseConfig } from '@/lib/diagnosis/config'
import configJson from '../../public/model/crop_guardian_config.json'

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

// What the on-device model can say about a potato leaf, with the app's advice for each.
export function diagnosisClasses() {
  const config = parseConfig(configJson)
  return {
    note: 'The model runs only on the phone; this server never sees photos. Every result is experimental and doses always follow the label.',
    classes: config.diseases
      .filter((id) => CLASS_CONTENT[id])
      .map((id) => ({ id, nameBn: config.labelsBn[id] ?? id, nameEn: CLASS_CONTENT[id].en, sign: CLASS_CONTENT[id].sign, steps: CLASS_CONTENT[id].steps })),
    unknown: 'When a photo looks like nothing the model knows, the app says «চিনতে পারিনি» and suggests sending it to the agriculture officer.',
  }
}
