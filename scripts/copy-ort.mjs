// Copies onnxruntime-web's wasm binary into public/ so the model runs offline, with no CDN.
// The version is part of the path, so an upgrade never mixes old and new runtime files.
// Also writes public/ort/sizes.json with the real size of each file the model worker downloads,
// for its progress bar: servers may compress these files and then send no usable length.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const WASM = 'ort-wasm-simd-threaded.wasm'
const pkgDir = join('node_modules', 'onnxruntime-web')
const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const outDir = join('public', 'ort')
const modelDir = join('public', 'model')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(join(outDir, version), { recursive: true })
copyFileSync(join(pkgDir, 'dist', WASM), join(outDir, version, WASM))

const sizes = { [`/ort/${version}/${WASM}`]: statSync(join(outDir, version, WASM)).size }
for (const file of readdirSync(modelDir).filter((f) => f.endsWith('.onnx'))) {
  sizes[`/model/${file}`] = statSync(join(modelDir, file)).size
}
writeFileSync(join(outDir, 'sizes.json'), JSON.stringify(sizes, null, 2) + '\n')
console.log(`Copied ${WASM} (onnxruntime-web ${version}) to ${join(outDir, version)}`)
