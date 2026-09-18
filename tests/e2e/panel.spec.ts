// ============================================
// Zarnama - User Panel E2E Tests (Phase 3)
// ============================================
// Critical: Login → Dashboard → Profile → Security → Sessions → Logout
//           Unauthorized → Protected Route → Login → callbackUrl → Dashboard
// هر تست یک کاربر تازه می‌سازد — isolation کامل بین اجرای موازی پروژه‌ها
// ============================================

import { test, expect, type Page } from '@playwright/test'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-panel' }

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

// ساخت کاربر تاییدشده از service layer — rate limit در لایه route است و اینجا اعمال نمی‌شود
// این روش سریع‌تر است و هر تست کاربر ایزوله خودش را دارد (اجرا�� موازی پروژه‌ها)
async function createUser(): Promise<string> {
  const mobile = uniqueMobile()
  await register({ mobile, password: PASSWORD }, meta)
  let code: string | null = null
  for (let i = 0; i < 10 && !code; i++) {
    code = await redis.get(`devotp:${mobile}`)
    if (!code) await new Promise((r) => setTimeout(r, 500))
  }
  expect(code, `OTP برای ${mobile} یافت نشد`).toBeTruthy()
  await verifyRegisterOtp(mobile, code!, meta)
  return mobile
}

async function login(page: Page, mobile: string) {
  await page.goto('/login')
  await page.getByLabel('شماره موبایل').fill(mobile)
  await page.getByLabel('رمز عبور').fill(PASSWORD)
  await page.getByRole('button', { name: 'ورود', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  // صبر تا پنل کاربر لود شود
  await expect(page.getByRole('heading', { name: /خوش آمدید/ })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('User Panel', () => {
  // چند bcrypt + جریان چندصفحه‌ای — زیر بار موازی کند است
  test.describe.configure({ timeout: 90_000 })

  test('Login → Dashboard → Profile → Security → Sessions → Notifications → Logout', async ({
    page,
  }) => {
    const mobile = await createUser()
    await login(page, mobile)

    // --- Dashboard: welcome + placeholderهای مالی (نه داده واقعی) ---
    await expect(page.getByText(/کیف پول ریالی و طلایی به‌زودی/)).toBeVisible()
    await expect(page.getByText(/هنوز تراکنشی ثبت نشده/)).toBeVisible()
    await expect(page.getByText(/به‌زودی — پیش‌نمایش/).first()).toBeVisible()

    // --- Profile: مشاهده + ویرایش ---
    await page.goto('/dashboard/profile')
    await expect(page.getByRole('heading', { name: 'پروفایل' })).toBeVisible()
    await page.getByRole('button', { name: 'ویرایش' }).click()
    await page.getByLabel('نام', { exact: true }).fill('کاربر')
    await page.getByLabel('نام خانوادگی').fill('تستی')
    await page.getByRole('button', { name: 'ذخیره' }).click()
    // پس از ذخیره، حالت نمایش برمی‌گردد و نام ذخیره‌شده دیده می‌شود (main = محتوای visible)
    await expect(page.locator('main').getByText('کاربر').first()).toBeVisible({
      timeout: 10_000,
    })

    // --- Security Center ---
    await page.goto('/dashboard/security')
    await expect(page.getByRole('heading', { name: 'مرکز امنیت' })).toBeVisible()
    await expect(page.getByText('وضعیت امنیت حساب')).toBeVisible()
    await expect(page.getByText('تغییر رمز عبور')).toBeVisible()

    // --- Sessions: نشست جاری + خروج از سایر نشست‌ها ---
    await page.goto('/dashboard/sessions')
    await expect(page.getByRole('heading', { name: 'نشست‌های فعال' })).toBeVisible()
    await expect(page.getByText('نشست جاری').first()).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'خروج از سایر نشست‌ها' }).click()
    // کاربر همچنان لاگین است — نشست جاری حفظ شده
    await expect(page.getByText('نشست جاری').first()).toBeVisible({ timeout: 10_000 })

    // --- Notifications ---
    await page.goto('/dashboard/notifications')
    await expect(page.getByRole('heading', { name: 'اعلان‌ها', exact: true })).toBeVisible()

    // --- Referral + Support (preview) ---
    await page.goto('/dashboard/referral')
    await expect(page.getByRole('heading', { name: 'معرفی دوستان' })).toBeVisible({
      timeout: 15_000,
    })
    await page.goto('/dashboard/support')
    await expect(page.getByRole('heading', { name: 'پشتیبانی', exact: true })).toBeVisible({
      timeout: 15_000,
    })

    // --- Logout ---
    await page
      .getByRole('button', { name: /خروج از حساب/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('Unauthorized → Protected Route → Login → callbackUrl → Dashboard', async ({
    page,
    context,
  }) => {
    const mobile = await createUser()
    await context.clearCookies()
    await page.goto('/dashboard/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page).toHaveURL(/callbackUrl=/)

    // ورود → بازگشت به همان مسیر محافظت‌شده
    await page.getByLabel('شماره موبایل').fill(mobile)
    await page.getByLabel('رمز عبور').fill(PASSWORD)
    await page.getByRole('button', { name: 'ورود', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard\/profile/, { timeout: 15_000 })
  })

  test('API isolation — بدون نشست، endpointهای users پاسخ 401 می‌دهند', async ({
    page,
    context,
  }) => {
    await context.clearCookies()
    for (const path of [
      '/api/v1/users/me',
      '/api/v1/users/sessions',
      '/api/v1/users/notifications',
      '/api/v1/users/security-events',
    ]) {
      const res = await page.request.get(path)
      expect(res.status(), `${path} باید 401 بدهد`).toBe(401)
    }
  })

  test('Navigation موبایل — bottom nav روی viewport کوچک دیده می‌شود', async ({ page }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width >= 768, 'فقط برای viewport موبایل')

    const mobile = await createUser()
    await login(page, mobile)
    // bottom nav موبایل — آخرین nav در DOM
    const bottomNav = page.locator('nav').last()
    await expect(bottomNav.getByRole('link', { name: 'داشبورد' })).toBeVisible()
    await expect(bottomNav.getByRole('link', { name: 'پروفایل' })).toBeVisible()
  })
})
