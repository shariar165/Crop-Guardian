// Which crop the camera diagnoses when the farmer hasn't picked one: the crop of the field Home last
// showed, else of the first field in season, else potato. Only crops with a model count.
import { type CropId, isCropId, type SeasonId, SEASONS } from '@/lib/crops'
import { type Field, inSeason } from '@/lib/fieldList'
import { canDiagnose, PHOTO_CROPS } from './crops'

export function defaultPhotoCrop(fields: Field[], chosen: SeasonId | null, today: string): CropId {
  const candidates = [
    ...(chosen && fields.some((f) => f.season === chosen) ? [SEASONS[chosen].crop] : []),
    ...fields.filter((f) => inSeason(f, today)).map((f) => SEASONS[f.season].crop),
  ]
  return candidates.find(canDiagnose) ?? PHOTO_CROPS[0]
}

// A crop asked for in the link (`/camera?crop=paddy`), if it can be diagnosed.
export function cropFromParam(value: string | null): CropId | null {
  return isCropId(value) && canDiagnose(value) ? value : null
}
