// تست موقت Visual QA — اسکرین‌شات داشبورد (دو فریم برای دیدن چرخش بنر)
import { test, expect } from '@playwright/test'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-visual' }

test('hero banners visual', async ({ page }) => {
  const mobile = `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
  await register({ mobile, password: PASSWORD }, meta)
  let code: string | null = null
  for (let i = 0; i < 10 && !code; i++) {
    code = await redis.get(`devotp:${mobile}`)
    if (!code) await new Promise((r) => setTimeout(r, 500))
  }
  await verifyRegisterOtp(mobile, code!, meta)
  await page.goto('/login')
  await page.getByLabel('شماره موبایل').fill(mobile)
  await page.getByLabel('رمز عبور').fill(PASSWORD)
  await page.getByRole('button', { name: 'ورود به حساب' }).click()
  await expect(page.getByText('موجودی کل')).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'C:/Users/NADFER/AppData/Local/Temp/dash-b1.png' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'C:/Users/NADFER/AppData/Local/Temp/dash-b2.png' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'C:/Users/NADFER/AppData/Local/Temp/dash-b3.png' })
})
