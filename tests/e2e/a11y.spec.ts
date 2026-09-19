// ============================================
// Zar30 - Accessibility Smoke Tests (Phase 3.1)
// ============================================
// بررسی‌های پایه دسترس پذیری روی صفحات کلیدی:
// landmarkها، سلسله مراتب heading، نام‌های در دسترس، label فرم‌ها، focus
// ============================================

import { test, expect } from '@playwright/test'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-a11y' }

function uniqueMobile() {
  return `0914${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function createUser(): Promise<string> {
  const mobile = uniqueMobile()
  await register({ mobile, password: PASSWORD }, meta)
  let code: string | null = null
  for (let i = 0; i < 10 && !code; i++) {
    code = await redis.get(`devotp:${mobile}`)
    if (!code) await new Promise((r) => setTimeout(r, 500))
  }
  expect(code).toBeTruthy()
  await verifyRegisterOtp(mobile, code!, meta)
  return mobile
}

test.describe('Accessibility Smoke', () => {
  test('صفحات عمومی — landmarks و heading', async ({ page }) => {
    for (const path of ['/', '/login', '/register']) {
      await page.goto(path)
      // html باید lang و dir داشته باشد
      await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      // landmark اصلی وجود دارد
      await expect(page.locator('main').first()).toBeVisible()
      // حداقل یک heading سطح ۱
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    }
  })

  test('فرم ورود — labelها به inputها متصل‌اند و focus کار می‌کند', async ({ page }) => {
    await page.goto('/login')
    // label → input association
    const mobile = page.getByLabel('شماره موبایل')
    const password = page.getByLabel('رمز عبور')
    await expect(mobile).toBeVisible()
    await expect(password).toBeVisible()
    // هر دو فیلد با کیبورد قابل فوکوس‌اند
    await mobile.focus()
    await expect(mobile).toBeFocused()
    await password.focus()
    await expect(password).toBeFocused()
    // دکمه اصلی نام در دسترس دارد
    await expect(page.getByRole('button', { name: 'ورود', exact: true })).toBeVisible()
  })

  test('User Panel — nav با aria-label و landmark درست', async ({ page }) => {
    const mobile = await createUser()
    await page.goto('/login')
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ورود', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /خوش آمدید/ })).toBeVisible({
      timeout: 30_000,
    })

    // هر viewport دقیقاً یک nav اصلی visible دارد
    const desktopNav = page.getByRole('navigation', { name: 'ناوبری اصلی پنل' })
    const mobileNav = page.getByRole('navigation', {
      name: 'ناوبری اصلی موبایل',
    })
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 768) {
      await expect(mobileNav).toBeVisible()
      await expect(desktopNav).toBeHidden()
    } else {
      await expect(desktopNav).toBeVisible()
      await expect(mobileNav).toBeHidden()
    }

    // آیتم nav فعلی aria-current دارد
    const visibleNav = viewport && viewport.width < 768 ? mobileNav : desktopNav
    await expect(visibleNav.getByRole('link').first()).toHaveAttribute('aria-current', 'page')
  })
})
