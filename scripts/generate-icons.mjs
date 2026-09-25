// ============================================
// Zar30 - PWA Icon Generator
// ============================================
// تولید آیکون‌های PNG موردنیاز manifest از لوگوی برند (brand-header.png)
// اجرا: node scripts/generate-icons.mjs
// ============================================

import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = join(root, 'public', 'brand-header.png')
const outDir = join(root, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

// پس‌زمینه navy برند — لوگوی landscape داخل مربع fit می‌شود
const NAVY = '#101d38'

// padding: نسبت حاشیه از هر طرف — maskable به حاشیه امن بیشتری نیاز دارد
const icons = [
  { name: 'icon-192x192.png', size: 192, padding: 0.12 },
  { name: 'icon-512x512.png', size: 512, padding: 0.12 },
  { name: 'icon-512x512-maskable.png', size: 512, padding: 0.22 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.14 },
]

for (const icon of icons) {
  const inner = Math.round(icon.size * (1 - icon.padding * 2))

  // لوگو landscape است — عرض را fit می‌کنیم و عمودی center می‌شود
  const logo = await sharp(logoPath)
    .resize({ width: inner, withoutEnlargement: false })
    .png()
    .toBuffer()

  const meta = await sharp(logo).metadata()
  const top = Math.round((icon.size - (meta.height ?? inner)) / 2)
  const left = Math.round((icon.size - (meta.width ?? inner)) / 2)

  await sharp({
    create: {
      width: icon.size,
      height: icon.size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: logo, top, left }])
    .png()
    .toFile(join(outDir, icon.name))

  console.log(`Generated: ${icon.name}`)
}

console.log('Done.')
