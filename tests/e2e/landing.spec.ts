// ============================================
// Zar30 - Landing E2E Tests
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
    await expect(page).toHaveTitle(/زرسی/)

    // هدر و Hero
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('هدر — dropdown باز می‌شود و لینک‌ها کار می‌کنند', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'فقط دسکتاپ — در موبایل dropdown وجود ندارد')
    await page.goto('/')

    // آیتم dropdown پشتیبانی
    const dropdownButton = page.getByRole('button', { name: /^پشتیبانی$/ })
    await expect(dropdownButton).toBeVisible()
    await dropdownButton.click()

    // پنل باز می‌شود و لینک‌های فرعی دیده می‌شوند (scope: فقط هدر)
    const faqLink = page.locator('header').getByRole('link', { name: 'سوالات متداول' })
    await expect(faqLink).toBeVisible()
    await faqLink.click()
    await expect(page).toHaveURL(/\/faq/)

    // Escape پنل را می‌بندد
    await page.goto('/')
    await dropdownButton.click()
    await expect(faqLink).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(faqLink).toBeHidden()
  })

  test('بخش‌های اصلی صفحه اصلی وجود دارند', async ({ page }) => {
    await page.goto('/')

    // کارت قیمت زنده در Hero
    await expect(page.getByText('طلای آب‌شده ۱۸ عیار').first()).toBeVisible()

    // کارت‌های اعتماد
    await expect(page.getByText('پشتوانه طلای فیزیکی').first()).toBeVisible()

    // بخش بازار
    await expect(page.getByRole('heading', { name: 'قیمت طلا را دنبال کنید' })).toBeVisible()

    // مراحل
    await expect(page.getByRole('heading', { name: 'در چهار قدم شروع کنید' })).toBeVisible()

    // FAQ
    await expect(page.getByRole('heading', { name: 'سوالات متداول' })).toBeVisible()

    // فوتر
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('FAQ accordion باز و بسته می‌شود', async ({ page }) => {
    await page.goto('/#faq')

    const firstQuestion = page.getByRole('button', { name: /زرسی چیست و چگونه کار می‌کند؟/ })
    await firstQuestion.click()

    // پاسخ باز می‌شود
    await expect(page.getByText(/پلتفرمی برای خرید، فروش و نگهداری طلای آب‌شده/)).toBeVisible()

    // دوباره بسته می‌شود
    await firstQuestion.click()
    await expect(page.getByText(/پلتفرمی برای خرید، فروش و نگهداری طلای آب‌شده/)).toBeHidden()
  })

  test('صفحات عمومی از فوتر در دسترس‌اند', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/')

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
    await expect(page.getByRole('heading', { name: 'ورود به زرسی' })).toBeVisible()

    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'ثبت‌نام در زرسی' })).toBeVisible()
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

  test('قیمت Demo هرگز Live نمایش داده نمی‌شود', async ({ page }) => {
    await page.goto('/')

    // کارت قیمت باید برچسب «داده نمایشی» داشته باشد (منبع demo)
    await expect(page.getByText('داده نمایشی').first()).toBeVisible()

    // نباید هیچ ادعای «زنده» بدون منبع واقعی باشد
    const liveBadges = await page.getByText('زنده', { exact: true }).count()
    expect(liveBadges).toBe(0)
  })

  test('لایه SEO محتوا وجود دارد و semantic است', async ({ page }) => {
    await page.goto('/')
    const seo = page.locator('#about-gold')
    await expect(seo).toBeAttached()
    await expect(seo.getByRole('heading', { name: 'زرسی چیست؟' })).toBeAttached()
  })
})

test.describe('Responsive', () => {
  test('در موبایل منوی همبرگری دیده می‌شود و کار می‌کند', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'فقط موبایل')
    await page.goto('/')

    // دکمه منوی موبایل
    const menuButton = page.getByRole('button', { name: /منو/i }).first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    // منو باز می‌شود
    await expect(page.getByRole('dialog')).toBeVisible()

    // accordion دسته‌ها باز می‌شود
    await page.getByRole('button', { name: /^قوانین$/ }).click()
    await expect(page.getByRole('dialog').getByRole('link', { name: 'حریم خصوصی' })).toBeVisible()

    // CTA داخل منو
    await expect(page.getByRole('dialog').getByRole('link', { name: 'شروع خرید' })).toBeVisible()
  })
})
