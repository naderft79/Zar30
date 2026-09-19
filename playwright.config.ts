// ============================================
// Zar30 - Playwright Config
// ============================================
// تست‌های E2E صفحات عمومی — Mobile + Tablet + Desktop
// ============================================

import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'

// bcryptjs خالص JS و CPU-bound است — cost پایین‌تر فقط برای E2E تا سرور تست
// زیر بار موازی workerها کرش نکند. مقدار production در .env همان ۱۲ می‌ماند
// (dotenv مقدار موجود را override نمی‌کند؛ این مقدار به webServer و workerها ارث می‌رسد)
process.env.BCRYPT_COST = '10'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
