// ============================================
// Zar30 - PM2 Production Configuration
// ============================================
// استفاده:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 save && pm2 startup
//
// Next.js مستقیم با Node اجرا می‌شود (next start) — بدون Docker
// Nginx روی 443 گوش می‌دهد و به 127.0.0.1:3000 پراکسی می‌کند
// ============================================

module.exports = {
  apps: [
    {
      name: 'zar30',
      cwd: './',
      // اجرای مستقیم Next.js server — معادل `pnpm start`
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      // fork mode — Next خودش multi-worker را با Node مدیریت می‌کند
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      // graceful shutdown — فرصت تکمیل درخواست‌های در حال پردازش
      kill_timeout: 10_000,
      listen_timeout: 15_000,
      wait_ready: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      // لاگ‌ها — با `pm2 logs zar30` یا فایل‌ها قابل مشاهده‌اند
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
}
