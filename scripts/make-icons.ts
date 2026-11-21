// The app icons for installing as an app (src/app/manifest.ts), drawn from the logo mark in
// src/app/icon.svg so they never drift from it. Re-run after changing the logo.
// Run: npx tsx scripts/make-icons.ts   (writes public/icons/*.png)
import { mkdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('src/app/icon.svg', 'utf8')
const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
// The mark without its own rounded tile, for the maskable icon.
const mark = inner.replace(/<rect[^>]*\/>/, '')

// A maskable icon is cropped to a circle or squircle by the launcher, so the background must fill
// the square and the mark must sit inside the middle 80% (the safe zone); 0.72 leaves a margin.
const SCALE = 0.72
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#2F6B3A"/>
  <g transform="translate(${16 - 16 * SCALE} ${16 - 16 * SCALE}) scale(${SCALE})">${mark}</g>
</svg>`

mkdirSync('public/icons', { recursive: true })
const render = (source: string, size: number, file: string) =>
  sharp(Buffer.from(source), { density: (72 * size) / 32 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/${file}`)

// The scripts run as CommonJS under tsx, so no top-level await.
Promise.all([render(svg, 192, 'icon-192.png'), render(svg, 512, 'icon-512.png'), render(maskable, 512, 'maskable-512.png')]).then(() =>
  console.log('Wrote public/icons/icon-192.png, icon-512.png, maskable-512.png'),
)
