// Copies onnxruntime-web's wasm binary into public/ so the model runs offline, with no CDN.
// The version is part of the path, so an upgrade never mixes old and new runtime files.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const WASM = 'ort-wasm-simd-threaded.wasm'
const pkgDir = join('node_modules', 'onnxruntime-web')
const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const outDir = join('public', 'ort')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(join(outDir, version), { recursive: true })
copyFileSync(join(pkgDir, 'dist', WASM), join(outDir, version, WASM))
console.log(`Copied ${WASM} (onnxruntime-web ${version}) to ${join(outDir, version)}`)
