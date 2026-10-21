// One upazila's map, loaded on its own so a page never carries every district's outlines.
import 'server-only'
import type { UpazilaShapes } from '@/lib/areas'
import { SHAPES } from '@/lib/geo/shapes'

export async function shapesOf(upazilaId: string): Promise<UpazilaShapes | null> {
  const load = SHAPES[upazilaId]
  return load ? ((await load()).default as UpazilaShapes) : null
}
