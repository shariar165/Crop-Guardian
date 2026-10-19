// The calibrated config exported with the model (public/model/crop_guardian_config.json).
// Classes, labels, preprocessing, temperature and thresholds all come from that file; none are copied here.

export const CONFIG_URL = '/model/crop_guardian_config.json'
export const MODEL_DIR = '/model/'

export type OodMethod = 'p_other' | 'energy' | 'msp'
const OOD_METHODS: OodMethod[] = ['p_other', 'energy', 'msp']

export type Rgb = [number, number, number]

export type DiagnosisConfig = {
  modelFile: string
  inputName: string
  outputName: string
  // Every model output, in logit order. The last one is the "other" output, which is only used
  // for the out-of-distribution score and is never a result.
  classes: string[]
  // The classes a photo can be diagnosed as: all but the last.
  diseases: string[]
  labelsBn: Record<string, string>
  preprocess: { resizeShorterSide: number; centerCrop: number; scale: number; mean: Rgb; std: Rgb }
  temperature: number
  qhat: number
  ood: { method: OodMethod; threshold: number }
}

type Json = Record<string, unknown>

function fail(msg: string): never {
  throw new Error(`Invalid diagnosis config: ${msg}`)
}

function obj(v: unknown, name: string): Json {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(`${name} must be an object`)
  return v as Json
}

function str(v: unknown, name: string): string {
  if (typeof v !== 'string' || v === '') fail(`${name} must be a non-empty string`)
  return v
}

function num(v: unknown, name: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${name} must be a finite number`)
  return v
}

function positive(v: unknown, name: string): number {
  const n = num(v, name)
  if (n <= 0) fail(`${name} must be positive`)
  return n
}

function rgb(v: unknown, name: string): Rgb {
  if (!Array.isArray(v) || v.length !== 3) fail(`${name} must have 3 values`)
  return v.map((x, i) => num(x, `${name}[${i}]`)) as Rgb
}

export function parseConfig(json: unknown): DiagnosisConfig {
  const c = obj(json, 'config')

  if (!Array.isArray(c.classes) || c.classes.length < 2) fail('classes must list at least 2 classes')
  const classes = c.classes.map((x, i) => str(x, `classes[${i}]`))
  if (new Set(classes).size !== classes.length) fail('classes must be unique')

  const labels = obj(c.labels_bn, 'labels_bn')
  const labelsBn = Object.fromEntries(classes.map((id) => [id, str(labels[id], `labels_bn.${id}`)]))

  const p = obj(c.preprocess, 'preprocess')
  if (p.layout !== 'NCHW') fail('preprocess.layout must be NCHW')
  if (p.dtype !== 'float32') fail('preprocess.dtype must be float32')
  const resizeShorterSide = positive(p.resize_shorter_side, 'preprocess.resize_shorter_side')
  const centerCrop = positive(p.center_crop, 'preprocess.center_crop')
  if (centerCrop > resizeShorterSide) fail('preprocess.center_crop must not exceed resize_shorter_side')
  const std = rgb(p.std, 'preprocess.std')
  if (std.some((s) => s <= 0)) fail('preprocess.std must be positive')

  const qhat = num(c.conformal_qhat, 'conformal_qhat')
  if (qhat < 0 || qhat > 1) fail('conformal_qhat must be within 0–1')

  const ood = obj(c.ood, 'ood')
  const method = ood.method as OodMethod
  if (!OOD_METHODS.includes(method)) fail(`ood.method must be one of ${OOD_METHODS.join(', ')}`)

  return {
    modelFile: str(c.model_file, 'model_file'),
    inputName: str(c.input_name, 'input_name'),
    outputName: str(c.output_name, 'output_name'),
    classes,
    diseases: classes.slice(0, -1),
    labelsBn,
    preprocess: {
      resizeShorterSide,
      centerCrop,
      scale: positive(p.scale, 'preprocess.scale'),
      mean: rgb(p.mean, 'preprocess.mean'),
      std,
    },
    temperature: positive(c.temperature, 'temperature'),
    qhat,
    ood: { method, threshold: num(ood.threshold, 'ood.threshold') },
  }
}

export async function loadConfig(url = CONFIG_URL): Promise<DiagnosisConfig> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Diagnosis config: HTTP ${res.status}`)
  return parseConfig(await res.json())
}
