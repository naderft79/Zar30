// ============================================
// Zarnama - User Panel E2E Tests (Phase 3.1)
// ============================================
// Critical: Login → Dashboard → Profile → Security → Sessions → Logout
//           Unauthorized → Protected Route → Login → callbackUrl → Dashboard
//           Navigation Contract — دقیقاً ۵ مقصد با ترتیب قرارداد (desktop + mobile)
// هر تست یک کاربر تازه می‌سازد — isolation کامل بین اجرای موازی پروژه‌ها
// ============================================

import { test, expect, type Page } from '@playwright/test'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-panel' }

// قرارداد دائمی ناوبری — ADR: Permanent User Panel Navigation
// ترتیب آرایه = ترتیب قرارداد؛ تغییر بدون ADR ممنوع
const NAV_CONTRACT = ['خانه', 'معاملات', 'دارایی', 'قسطی', 'پروفایل'] as const
// match کامل — جلوی تغییر نام/الحاق متن به label را می‌گیرد
const NAV_CONTRACT_EXACT = NAV_CONTRACT.map((l) => new RegExp(`^${l}$`))

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

// ساخت کاربر تاییدشده از service layer — rate limit در لایه route است و اینجا اعمال نمی‌شود
// این روش سریع‌تر است و هر تست کاربر ایزوله خودش را دارد (اجرای موازی پروژه‌ها)
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
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  // صبر تا پنل کاربر لود شود
  await expect(page.getByRole('heading', { name: /خوش آمدید/ })).toBeVisible({
    timeout: 30_000,
  })
}

// nav قابل‌مشاهده در viewport فعلی را برمی‌گرداند:
// desktop → sidebar «ناوبری اصلی پنل» | mobile → bottom nav «ناوبری اصلی موبایل»
async function visibleNav(page: Page) {
  const desktop = page.getByRole('navigation', { name: 'ناوبری اصلی پنل' })
  const mobile = page.getByRole('navigation', { name: 'ناوبری اصلی موبایل' })
  const viewport = page.viewportSize()
  return viewport && viewport.width < 768 ? mobile : desktop
}

test.describe('User Panel', () => {
  // چند bcrypt + جریان چندصفحه‌ای — زیر بار موازی کند است
  test.describe.configure({ timeout: 120_000 })

  test('Login → Dashboard → Trade → Assets → Installments → Profile hub → Logout', async ({
    page,
  }) => {
    const mobile = await createUser()
    await login(page, mobile)

    // --- Dashboard: خلاصه مالی + placeholderها (نه داده واقعی) ---
    await expect(page.getByText('ارزش کل دارایی')).toBeVisible()
    await expect(page.getByText('موجودی طلا')).toBeVisible()
    await expect(page.getByText('موجودی ریالی')).toBeVisible()
    await expect(page.getByText(/قیمت لحظه‌ای به‌زودی/)).toBeVisible()
    await expect(page.getByText(/هنوز تراکنشی ثبت نشده/)).toBeVisible()

    // --- Trade (preview) ---
    await page.goto('/dashboard/trade')
    await expect(page.getByRole('heading', { name: 'معاملات', exact: true })).toBeVisible()
    await expect(page.getByText('خرید طلا').first()).toBeVisible()
    await expect(page.getByText(/سفارش بازی ندارید/)).toBeVisible()

    // --- Assets (preview) ---
    await page.goto('/dashboard/assets')
    await expect(page.getByRole('heading', { name: 'دارایی', exact: true })).toBeVisible()
    await expect(page.getByText(/هنوز تراکنشی ثبت نشده/)).toBeVisible()

    // --- Installments (preview) ---
    await page.goto('/dashboard/installments')
    await expect(page.getByRole('heading', { name: 'خرید قسطی', exact: true })).toBeVisible()
    await expect(page.getByText(/قراردادی ندارید/)).toBeVisible()

    // --- Profile hub: مشاهده + ویرایش ---
    await page.goto('/dashboard/profile')
    await expect(page.getByRole('heading', { name: 'پروفایل' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'ویرایش' }).click()
    await page.getByLabel('نام', { exact: true }).fill('کاربر')
    await page.getByLabel('نام خانوادگی').fill('تستی')
    await page.getByRole('button', { name: 'ذخیره' }).click()
    // پس از ذخیره، حالت نمایش برمی‌گردد و نام ذخیره‌شده دیده می‌شود (main = محتوای visible)
    await expect(page.locator('main').getByText('کاربر').first()).toBeVisible({
      timeout: 10_000,
    })

    // --- Security Center (زیر پروفایل) ---
    await page.goto('/dashboard/profile/security')
    await expect(page.getByRole('heading', { name: 'مرکز امنیت' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('وضعیت امنیت حساب')).toBeVisible()
    await expect(page.getByText('تغییر رمز عبور')).toBeVisible()

    // --- Sessions: نشست جاری + خروج از سایر نشست‌ها ---
    await page.goto('/dashboard/profile/sessions')
    await expect(page.getByRole('heading', { name: 'دستگاه‌ها و نشست‌ها' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('نشست جاری').first()).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'خروج از سایر نشست‌ها' }).click()
    // کاربر همچنان لاگین است — نشست جاری حفظ شده
    await expect(page.getByText('نشست جاری').first()).toBeVisible({ timeout: 10_000 })

    // --- Notifications (از طریق header — nav item نیست) ---
    await page.goto('/dashboard/notifications')
    await expect(page.getByRole('heading', { name: 'اعلان‌ها', exact: true })).toBeVisible({
      timeout: 15_000,
    })

    // --- Referral + Support (زیر پروفایل) ---
    await page.goto('/dashboard/profile/referral')
    await expect(page.getByRole('heading', { name: 'معرفی دوستان' })).toBeVisible({
      timeout: 15_000,
    })
    await page.goto('/dashboard/profile/support')
    await expect(page.getByRole('heading', { name: 'پشتیبانی', exact: true })).toBeVisible({
      timeout: 15_000,
    })

    // --- مسیرهای قدیمی redirect می‌شوند ---
    await page.goto('/dashboard/security')
    await expect(page).toHaveURL(/\/dashboard\/profile\/security/, { timeout: 15_000 })

    // --- Logout (از صفحه پروفایل — روی هر دو viewport قابل دسترس) ---
    await page.goto('/dashboard/profile')
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

  // ============================================
  // PERMANENT USER NAVIGATION CONTRACT — E2E guard
  // دقیقاً ۵ آیتم با همین ترتیب، desktop و mobile با IA یکسان
  // ============================================
  test('Navigation Contract — دقیقاً پنج مقصد با ترتیب قرارداد', async ({ page }) => {
    const mobile = await createUser()
    await login(page, mobile)

    const nav = await visibleNav(page)
    const links = nav.getByRole('link')
    // دقیقاً ۵ آیتم — نه بیشتر، نه کمتر
    await expect(links).toHaveCount(NAV_CONTRACT.length)
    // ترتیب دقیق قرارداد
    await expect(links).toHaveText([...NAV_CONTRACT_EXACT])
  })

  test('Navigation Contract — هر دو nav از یک IA می‌آیند', async ({ page }) => {
    const mobile = await createUser()
    await login(page, mobile)

    // هر دو nav در DOM هستند (یکی با CSS مخفی است — getByRole مخفی را نمی‌بیند)
    // هر کدام دقیقاً همان ۵ آیتم قرارداد را با همان ترتیب دارند
    for (const label of ['ناوبری اصلی پنل', 'ناوبری اصلی موبایل']) {
      const links = page.locator(`nav[aria-label="${label}"] a`)
      await expect(links).toHaveCount(NAV_CONTRACT.length)
      await expect(links).toHaveText([...NAV_CONTRACT_EXACT])
    }
  })
})
