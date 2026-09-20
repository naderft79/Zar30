import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config as dotenvConfig } from 'dotenv'

// لود env vars برای تست‌ها
dotenvConfig({ path: '.env' })

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    environment: 'node',
    // integration tests روی DB واقعی چند bcrypt (cost 12) اجرا می‌کنند و زمان‌برند
    testTimeout: 30_000,
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.next/'],
    },
  },
})
