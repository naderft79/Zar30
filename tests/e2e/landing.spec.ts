// ============================================
// Zarnama - Landing E2E Tests
// ============================================
// Open Homepage → Navigate → Login → Register
// + SEO + RTL + Responsive checks
// ============================================

import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('صفحه اصلی بارگذاری می‌شود و RTL است', async ({ page }) => {
    await page.goto('/')

    // جهت و زبان
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa')

    // عنوان صفحه
    await expect(page).toHaveTitle(/زرنما/)

    // هدر و Hero
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('ناوبری به بخش‌ها و صفحات عمومی کار می‌کند', async ({ page }) => {
    await page.goto('/')

    // لینک anchor به بخش FAQ — فقط در ناوبری دسکتاپ (در موبایل لینک فوتر به /faq است)
    const navLink = page.locator('header nav').getByRole('link', { name: 'سوالات متداول' })
    if (await navLink.isVisible()) {
      await navLink.click()
      await expect(page).toHaveURL(/#faq/)
    }

    // صفحات عمومی مستقیم
    for (const route of [
      '/about',
      '/security',
      '/faq',
      '/contact',
      '/blog',
      '/terms',
      '/privacy',
    ]) {
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }
  })

  test('صفحات ورود و ثبت‌نام باز می‌شوند', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'ورود به زرنما' })).toBeVisible()

    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'ثبت‌نام در زرنما' })).toBeVisible()
  })

  test('SEO — metadata و canonical موجود است', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /.+/)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest/)

    // JSON-LD
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toHaveCount(1)
  })

  test('sitemap و robots در دسترس‌اند', async ({ page }) => {
    const sitemap = await page.request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain('<url>')

    const robots = await page.request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap')
  })

  test('ویجت قیمت داده Demo را Live نمایش نمی‌دهد', async ({ page }) => {
    await page.goto('/')

    // نباید هیچ ادعای "قیمت لحظه‌ای/زنده" بدون برچسب Demo باشد
    const body = await page.textContent('body')
    expect(body).not.toMatch(/قیمت لحظه‌ای بازار/)
  })
})

test.describe('Responsive', () => {
  test('در موبایل منوی همبرگری دیده می‌شود', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'فقط موبایل')
    await page.goto('/')

    // دکمه منوی موبایل
    const menuButton = page.getByRole('button', { name: /منو|menu/i }).first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    // منو باز می‌شود
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
