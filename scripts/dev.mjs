// ============================================
// Zar30 - Dev Server Launcher (strict port 3000)
// ============================================
// قبل از بالا آمدن Next، هر پروسه اشغال‌کننده پورت 3000 را می‌بندد
// تا dev server همیشه روی http://localhost:3000 سرو شود.
// استفاده:
//   node scripts/dev.mjs --turbopack
//   node scripts/dev.mjs --turbopack -H 0.0.0.0
// ============================================

import { execSync, spawn } from 'node:child_process'

const PORT = 3000

// بستن پروسه‌های LISTENING روی پورت — Windows (netstat/taskkill) و Unix (lsof)
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString()
      const pids = new Set(
        out
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter(Boolean),
      )
      for (const pid of pids) {
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
            console.log(`[dev] killed stale process on port ${port} (pid ${pid})`)
          } catch {
            // پروسه ممکن است هم‌اکنون بسته شده باشد
          }
        }
      }
    } else {
      const out = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
      for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
        try {
          process.kill(Number(pid), 'SIGKILL')
          console.log(`[dev] killed stale process on port ${port} (pid ${pid})`)
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // findstr/lsof وقتی چیزی پیدا نکنند exit code غیرصفر می‌دهند — یعنی پورت آزاد است
  }
}

freePort(PORT)

const args = [
  'node_modules/next/dist/bin/next',
  'dev',
  '-p',
  String(PORT),
  ...process.argv.slice(2),
]
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 0))
