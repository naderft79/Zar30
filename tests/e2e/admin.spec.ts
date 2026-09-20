import { test, expect, type Page } from '@playwright/test'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'

const PASSWORD = 'Test@1234'
const meta = { ip: '127.0.0.1', userAgent: 'e2e-admin' }
function mobile() {
  return `0916${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}
async function createUser() {
  const value = mobile()
  await register({ mobile: value, password: PASSWORD }, meta)
  const code = await redis.get(`devotp:${value}`)
  await verifyRegisterOtp(value, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile: value } })
}
async function createAdmin(role: 'SUPER_ADMIN' | 'SUPPORT') {
  const user = await createUser()
  await prisma.adminUser.create({ data: { userId: user.id, role, permissions: {} } })
  return user
}
async function login(page: Page, mobileNumber: string, callback = '/admin/dashboard') {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callback)}`)
  await page.getByLabel('شماره موبایل').fill(mobileNumber)
  await page.getByLabel('رمز عبور').fill(PASSWORD)
  await page.getByRole('button', { name: 'ورود', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(callback.replaceAll('/', '\/')), { timeout: 30_000 })
}
async function openAdminNav(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) < 1280) {
    await page.getByRole('button', { name: 'باز کردن ناوبری مرکز عملیات' }).click()
  }
  return page.getByRole('navigation', { name: 'ناوبری مرکز عملیات' })
}

test.describe('Admin Operations Center', () => {
  test.describe.configure({ timeout: 120_000 })

  test('SUPER_ADMIN login → dashboard → permission-aware navigation → real modules', async ({
    page,
  }, testInfo) => {
    const admin = await createAdmin('SUPER_ADMIN')
    await login(page, admin.mobile)
    await expect(page.getByRole('heading', { name: 'داشبورد عملیاتی' })).toBeVisible()
    await expect(page.getByText('داده‌های عملیاتی از PostgreSQL')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('admin-dashboard.png'), fullPage: true })

    const nav = await openAdminNav(page)
    await expect(nav.getByRole('link')).toHaveCount(30)
    await expect(nav.getByRole('link', { name: 'کاربران' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'لاگ ممیزی' })).toBeVisible()

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'کاربران', exact: true })).toBeVisible()
    await page.goto('/admin/accounts')
    await expect(page.getByRole('heading', { name: 'حساب‌های دارایی', exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/فقط خواندنی/).first()).toBeVisible()
    await page.goto('/admin/support')
    await expect(page.getByRole('heading', { name: 'مرکز پشتیبانی' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /جستجوی سراسری/ })).toBeVisible()
  })

  test('SUPPORT فقط ماژول‌های مجاز را می‌بیند و API مالی 403 است', async ({ page }) => {
    const admin = await createAdmin('SUPPORT')
    await login(page, admin.mobile)
    const nav = await openAdminNav(page)
    await expect(nav.getByRole('link', { name: 'کاربران' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'پشتیبانی' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'برداشت‌ها' })).toHaveCount(0)
    const response = await page.request.get('/api/v1/admin/withdrawals')
    expect(response.status()).toBe(403)
  })

  test('کاربر عادی admin access ندارد و API محافظت می‌شود', async ({ page, context }) => {
    const user = await createUser()
    await login(page, user.mobile)
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { name: 'دسترسی مجاز نیست' })).toBeVisible({
      timeout: 15_000,
    })
    expect((await page.request.get('/api/v1/admin/dashboard')).status()).toBe(403)
    await context.clearCookies()
    expect((await page.request.get('/api/v1/admin/dashboard')).status()).toBe(401)
  })
})
