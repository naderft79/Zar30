import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config as dotenvConfig } from 'dotenv'

// لود env vars برای تست‌ها
dotenvConfig({ path: '.env' })

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    environment: 'node',
    // تست‌های integration یک PostgreSQL مشترک دارند — اجرای موازی فایل‌ها
    // باعث race روی state مشترک (مثل آخرین GoldPrice) می‌شود
    fileParallelism: false,
    // integration tests روی DB واقعی چند bcrypt (cost 12) اجرا می‌کنند و زمان‌برند
    testTimeout: 30_000,
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // پوشش معنادار فقط روی منطق دامنه (src/lib) سنجیده می‌شود —
      // صفحات React و routeهای نازل API توسط تست‌های e2e پوشش داده می‌شوند
      include: ['src/lib/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        'src/generated/**',
        'src/types/**',
        'src/lib/types/**',
        'src/lib/mobile/**',
      ],
      // کف پوشش روی منطق دامنه — اندازه‌گیری فعلی: ~۸۰.۵٪ stmts / ~۸۲٪ funcs / ~۶۹٪ branches
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 65,
      },
    },
  },
})
