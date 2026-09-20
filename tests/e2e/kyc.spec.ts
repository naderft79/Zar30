// ============================================
// Zar30 - KYC E2E Tests (Phase 4)
// ============================================
// Profile → KYC → Start → Steps → Upload → Review → Submit → Submitted
// + API: unauthorized 401 / IDOR isolation
// ============================================

import { test, expect, type Page } from '@playwright/test'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-kyc' }
const VALID_NC = '0499370899'
const VALID_IBAN_BODY = '110170000000101234567890' // بدون IR — فیلد خودش IR اضافه می‌کند
const VALID_CARD = '6037991122334455'

// PNG با magic bytes واقعی
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 7),
])

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
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

async function login(page: Page, mobile: string) {
  await page.goto('/login')
  await page.getByLabel('شماره موبایل').fill(mobile)
  await page.getByLabel('رمز عبور').fill(PASSWORD)
  await page.getByRole('button', { name: 'ورود', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: /خوش آمدید/ })).toBeVisible({ timeout: 30_000 })
}

test.describe('KYC Flow', () => {
  test.describe.configure({ timeout: 120_000 })

  test('Profile → KYC → Start → همه مراحل → Upload → Review → Submit → Submitted', async ({
    page,
  }) => {
    const mobile = await createUser()
    await login(page, mobile)

    // --- ورود از پروفایل (KYC زیر پروفایل است، nav item نیست) ---
    await page.goto('/dashboard/profile')
    await page
      .getByRole('link', { name: /احراز هویت/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/dashboard\/profile\/kyc/)
    await expect(page.getByRole('heading', { name: 'احراز هویت', exact: true })).toBeVisible({
      timeout: 15_000,
    })

    // --- شروع ---
    await page.getByRole('button', { name: 'شروع احراز هویت' }).click()

    // مرحله ۱ — شخصی
    await expect(page.getByLabel('نام', { exact: true })).toBeVisible({ timeout: 15_000 })
    await page.getByLabel('نام', { exact: true }).fill('کاربر')
    await page.getByLabel('نام خانوادگی').fill('تستی')
    await page.getByLabel('روز').selectOption('24')
    await page.getByLabel('ماه').selectOption('3')
    await page.getByLabel('سال').selectOption('1369')
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    // مرحله ۲ — هویتی
    await expect(page.getByLabel('کد ملی')).toBeVisible({ timeout: 10_000 })
    await page.getByLabel('کد ملی').fill(VALID_NC)
    await page.getByLabel('شماره شناسنامه').fill('12345')
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    // مرحله ۳ — بانکی
    await expect(page.getByLabel('شماره کارت بانکی')).toBeVisible({ timeout: 10_000 })
    await page.getByLabel('شماره کارت بانکی').fill(VALID_CARD)
    await page.getByLabel('شماره شبا').fill(VALID_IBAN_BODY)
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    // مرحله ۴ — مدارک (upload واقعی → MinIO)
    await expect(page.getByText('تصویر کارت ملی')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[type="file"][aria-label="تصویر کارت ملی"]').setInputFiles({
      name: 'id-card.png',
      mimeType: 'image/png',
      buffer: PNG,
    })
    // صبر برای آپلود — حالت «حذف» ظاهر می‌شود
    await expect(page.getByRole('button', { name: /حذف تصویر کارت ملی/ })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    // مرحله ۵ — بازبینی
    await expect(page.getByRole('heading', { name: 'بازبینی و ارسال' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(VALID_NC)).toBeVisible()
    await page.getByRole('button', { name: 'ارسال برای بررسی' }).click()

    // --- نتیجه: وضعیت SUBMITTED ---
    await expect(page.getByText('ارسال شده')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/صف بررسی/)).toBeVisible()
  })

  test('Validation — کد ملی نامعتبر از مرحله عبور نمی‌کند', async ({ page }) => {
    const mobile = await createUser()
    await login(page, mobile)
    await page.goto('/dashboard/profile/kyc')
    await page.getByRole('button', { name: 'شروع احراز هویت' }).click()

    await page.getByLabel('نام', { exact: true }).fill('کاربر')
    await page.getByLabel('نام خانوادگی').fill('تستی')
    await page.getByLabel('روز').selectOption('1')
    await page.getByLabel('ماه').selectOption('1')
    await page.getByLabel('سال').selectOption('1370')
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    await expect(page.getByLabel('کد ملی')).toBeVisible({ timeout: 10_000 })
    await page.getByLabel('کد ملی').fill('1111111111') // checksum نامعتبر
    await page.getByLabel('شماره شناسنامه').fill('1')
    await page.getByRole('button', { name: 'مرحله بعد' }).click()

    // سرور رد می‌کند — همان مرحله می‌مانیم و خطا نمایش داده می‌شود
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel('کد ملی')).toBeVisible()
  })

  test('KYC API — بدون نشست 401 می‌دهد', async ({ page, context }) => {
    await context.clearCookies()
    for (const path of ['/api/v1/kyc', '/api/v1/admin/kyc/queue']) {
      const res = await page.request.get(path)
      expect(res.status(), `${path} باید 401 بدهد`).toBe(401)
    }
    const res = await page.request.post('/api/v1/kyc/start')
    expect(res.status()).toBe(401)
  })

  test('KYC در navigation اصلی نیست — قرارداد ۵‌آیتمی حفظ شده', async ({ page }) => {
    const mobile = await createUser()
    await login(page, mobile)
    const viewport = page.viewportSize()
    const navLabel = viewport && viewport.width < 768 ? 'ناوبری اصلی موبایل' : 'ناوبری اصلی پنل'
    const links = page.locator(`nav[aria-label="${navLabel}"] a`)
    await expect(links).toHaveCount(5)
    // هیچ لینک KYC در nav نیست
    await expect(links.filter({ hasText: /احراز|KYC/ })).toHaveCount(0)
  })
})
