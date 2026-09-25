// ============================================
// Zar30 - Mobile Build (Capacitor static export)
// ============================================
// بیلد WebView برای APK: route handlerها (api/, serwist/) در static export
// پشتیبانی نمی‌شوند — موقتاً از src/app خارج و بعد از build برمی‌گردند.
// API روی native از طریق NEXT_PUBLIC_API_URL به سرور production/dev وصل می‌شود.
//
//   pnpm build:mobile
// ============================================

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const appDir = path.join('src', 'app')
const stashDir = '.mobile-build-stash'
// پوشه‌های route handler که در export وجود ندارند
const excluded = ['api', 'serwist']

function stash() {
  fs.mkdirSync(stashDir, { recursive: true })
  for (const dir of excluded) {
    const src = path.join(appDir, dir)
    if (!fs.existsSync(src)) continue
    try {
      fs.renameSync(src, path.join(stashDir, dir))
    } catch {
      // dev server روی ویندوز روی پوشه watch handle دارد → rename ممکن نیست
      // نسخه‌برداری و حذف محتوای داخل — watch handler خودِ فایل‌ها را قفل نمی‌کند
      console.log(`rename blocked (dev server watching?) — falling back to copy+delete: ${dir}`)
      fs.cpSync(src, path.join(stashDir, dir), { recursive: true })
      fs.rmSync(src, { recursive: true })
    }
  }
}

function restore() {
  for (const dir of excluded) {
    const stashed = path.join(stashDir, dir)
    const dst = path.join(appDir, dir)
    if (!fs.existsSync(stashed)) continue
    if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true })
    fs.renameSync(stashed, dst)
  }
  fs.rmSync(stashDir, { recursive: true, force: true })
}

try {
  stash()
  const result = spawnSync('pnpm', ['exec', 'next', 'build', '--turbopack'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, BUILD_TARGET: 'mobile' },
  })
  process.exitCode = result.status ?? 1
} finally {
  // حتی در صورت خطای build پوشه‌ها برمی‌گردند
  restore()
}
