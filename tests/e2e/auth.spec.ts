// ============================================
// Zarnama - Auth E2E Tests (Phase 2)
// ============================================
// Critical: Register → OTP → Login → Session → Logout
//           Login → Revoke Session → Access Denied
// OTP از endpoint مخصوص dev خوانده می‌شود (SMS_PROVIDER=mock)
// ============================================

import { test, expect, type Page } from '@playwright/test'

const PASSWORD = 'Test@1234'

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function getOtpCode(page: Page, mobile: string): Promise<string> {
  // صبر کوتاه تا Mock SMS کد را در Redis بنویسد
  for (let i = 0; i < 10; i++) {
    const res = await page.request.get(`/api/v1/dev/otp/${mobile}`)
    if (res.ok()) {
      const json = await res.json()
      if (json?.data?.code) return json.data.code as string
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`OTP برای ${mobile} یافت نشد`)
}

async function fillOtp(page: Page, code: string) {
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(`رقم ${i + 1}`).fill(code[i]!)
  }
}

test.describe('Authentication', () => {
  // جریان‌های چندمرحله‌ای شامل چند bcrypt (cost 12) هستند و زیر بار موازی کند می‌شوند
  test.describe.configure({ timeout: 120_000 })
  test('Register → OTP → Login → Dashboard → Logout', async ({ page }) => {
    const mobile = uniqueMobile()

    // ۱. ثبت‌نام
    await page.goto('/register')
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ثبت‌نام', exact: true }).click()

    // ۲. صفحه OTP
    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 30_000 })
    const code = await getOtpCode(page, mobile)
    await fillOtp(page, code)
    await page.getByRole('button', { name: 'تایید' }).click()

    // ۳. تایید موفق → لینک ورود
    await expect(page.getByRole('link', { name: 'ورود به حساب' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('link', { name: 'ورود به حساب' }).click()

    // ۴. ورود
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ورود', exact: true }).click()

    // ۵. داشبورد — پنل کاربر Phase 3 (main همیشه visible است؛ sidebar در موبایل hidden است)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
    await expect(page.locator('main').getByText(mobile)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /خوش آمدید/ })).toBeVisible({ timeout: 30_000 })

    // ۶. خروج → بازگشت به login
    // دکمه خروج در sidebar دسکتاپ و صفحه پروفایل است؛ رفتن به پروفایل روی هر دو viewport کار می‌کند
    await page.goto('/dashboard/profile')
    await page
      .getByRole('button', { name: /خروج از حساب/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('Login → Revoke Session → Access Denied', async ({ page }) => {
    // کاربر تست seed شده
    await page.goto('/login')
    await page.getByLabel('شماره موبایل').fill('09123456789')
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ورود', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

    // لیست نشست‌ها از API — با همان cookieهای مرورگر
    const list = await page.request.get('/api/v1/auth/sessions')
    expect(list.ok()).toBe(true)
    const { data } = await list.json()
    expect(data.sessions.length).toBeGreaterThan(0)

    // همه نشست‌ها revoke می‌شوند (شامل جاری)
    for (const s of data.sessions) {
      await page.request.delete(`/api/v1/auth/sessions/${s.id}`)
    }

    // تلاش دسترسی به API محافظت‌شده → 401
    const me = await page.request.get('/api/v1/auth/me')
    expect(me.status()).toBe(401)
  })

  test('دسترسی مستقیم به dashboard بدون احراز → redirect به login', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('ورود با رمز اشتباه خطا نمایش می‌دهد', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('شماره موبایل').fill('09123456789')
    await page.getByLabel('رمز عبور').fill('WrongPass999')
    await page.getByRole('button', { name: 'ورود', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('فراموشی رمز → دریافت کد → reset → ورود با رمز جدید', async ({ page }) => {
    const mobile = uniqueMobile()
    // اول یک کاربر بسازیم
    await page.goto('/register')
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ثبت‌نام', exact: true }).click()
    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 30_000 })
    const regCode = await getOtpCode(page, mobile)
    await fillOtp(page, regCode)
    await page.getByRole('button', { name: 'تایید' }).click()
    await expect(page.getByRole('link', { name: 'ورود به حساب' })).toBeVisible({ timeout: 30_000 })

    // فراموشی رمز
    await page.goto('/forgot-password')
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByRole('button', { name: 'ارسال کد بازیابی' }).click()
    await expect(page).toHaveURL(/\/reset-password/, { timeout: 30_000 })

    const resetCode = await getOtpCode(page, mobile)
    await page.getByLabel('کد تایید (۶ رقم)').fill(resetCode)
    await page.getByLabel('رمز عبور جدید').fill('NewPass@99')
    await page.getByRole('button', { name: 'تغییر رمز عبور' }).click()
    await expect(page.getByRole('link', { name: 'ورود با رمز جدید' })).toBeVisible({
      timeout: 30_000,
    })

    // ورود با رمز جدید
    await page.getByRole('link', { name: 'ورود با رمز جدید' }).click()
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill('NewPass@99')
    await page.getByRole('button', { name: 'ورود', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })
})
