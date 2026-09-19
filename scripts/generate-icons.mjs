// ============================================
// Zar30 - PWA Icon Generator
// ============================================
// تولید آیکون‌های PNG موردنیاز manifest از SVG برند
// اجرا: node scripts/generate-icons.mjs
// ============================================

import { readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'public', 'icon.svg')
const outDir = join(root, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

// پس‌زمینه navy برای maskable — آیکون با حاشیه امن
const NAVY = '#1a2a4f'

const icons = [
  { name: 'icon-192x192.png', size: 192, padding: 0 },
  { name: 'icon-512x512.png', size: 512, padding: 0 },
  { name: 'icon-512x512-maskable.png', size: 512, padding: 0.15 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.1 },
]

for (const icon of icons) {
  const inner = Math.round(icon.size * (1 - icon.padding * 2))
  const offset = Math.round(icon.size * icon.padding)

  const logo = await sharp(svg, { density: 300 })
    .resize(inner, inner)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: icon.size,
      height: icon.size,
      channels: 4,
      background: icon.padding > 0 ? NAVY : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(join(outDir, icon.name))

  console.log(`Generated: ${icon.name}`)
}

console.log('Done.')
