# Phase 1 Report — Landing & Public Website

**تاریخ:** 2026-09-18
**وضعیت:** ✅ DONE — Final Gate پاس شد

---

## هدف

ساخت Landing Page کاملاً Production-Ready برای برند زرنما: هویت بصری Premium (navy/gold/cream)، فارسی/RTL با فونت Vazirmatn، معماری Public Website قابل توسعه، بدون دست‌کاری Financial Core.

---

## بخش‌های ساخته‌شده

### صفحات (Route)

| Route                 | نوع    | توضیح                                         |
| --------------------- | ------ | --------------------------------------------- |
| `/`                   | public | Landing کامل — ۱۵ بخش                         |
| `/about`              | public | درباره زرنما — داستان، ارزش‌ها، آمار          |
| `/security`           | public | امنیت — لایه‌ها، KYC، audit، مدیریت ریسک      |
| `/faq`                | public | سوالات متداول — Accordion از داده مرکزی       |
| `/contact`            | public | تماس — کانال‌ها + فرم (backend در Phase بعدی) |
| `/blog`               | public | معماری بلاگ — آماده برای CMS                  |
| `/terms`              | public | قوانین و مقررات                               |
| `/privacy`            | public | حریم خصوصی                                    |
| `/login`, `/register` | auth   | placeholder — منطق احراز هویت در Phase 2      |
| `/api/v1/price`       | API    | سرویس قیمت (Mock/Dev)                         |
| `/sitemap.xml`        | SEO    | sitemap از `app/sitemap.ts`                   |
| `/robots.txt`         | SEO    | robots — auth و api محروم                     |
| `/opengraph-image`    | SEO    | تصویر OG پویا (متن لاتین — محدودیت satori)    |

### کامپوننت‌های Design System

- `Container`, `Section` (+`titleAs` برای کنترل h1/h2)، `Logo` (SVG برند)
- `Accordion`, `Dialog`, `Tooltip` (Radix) — علاوه بر Button, Input, Card, Badge, Skeleton موجود
- `CardTitle` → `h3`، `CardDescription` → `p` (معناشناسی)

### بخش‌های Landing (`src/components/landing/`)

**شمارش واقعی از Source Code** (`src/app/(public)/page.tsx` — مرجع شمارش):

بخش‌های اصلی Landing = **۱۴** (پس از Cleanup): Hero, PriceSection, Features, WhyZarnama, Stats, HowItWorks, InvestmentPreview, InstallmentPreview, SecuritySection, PhysicalGold, ReferralSection, FaqSection, DownloadApp, CtaSection

توضیح اعداد قبلی:

- در گزارش اولیه «۱۵» ثبت شده بود — Hero تا CtaSection قبل از حذف Testimonials دقیقاً 15 بود.
- `GoldCalculator` یک Section مستقل نیست — داخل `PriceSection` رندر می‌شود (اگر شمرده شود، بصری ۱۶ بلوک دیده می‌شود؛ ساختاری ۱۴ است).
- `Header`, `MobileMenu`, `Footer`, `PriceWidget`, `GoldCalculator` جزو ۲۰ **کامپوننت** پوشه landing هستند، نه Section.

**Cleanup Social Proof (2026-09-18):** بخش `Testimonials` و داده‌های ساختگی (۴ نظر جعلی) حذف شد. `STATS` که «+۵۰,۰۰۰ کاربر»، «+۱۲۰ کیلوگرم طلا»، «+۱ میلیون تراکنش» را نمایش می‌داد — بدون منبع واقعی — با قابلیت‌های واقعی محصول جایگزین شد (۲۴/۷، شفافیت دفتر کل، خرید با هر مبلغ، ۴ سطح احراز هویت). برای پلتفرم مالی، Fake Social Proof ممنوع است. آمار واقعی پس از لانش از DB/CMS تغذیه می‌شود.

### داده و سرویس‌ها

- `src/lib/data/landing.ts` — منبع واحد داده‌های Landing (NAV_LINKS, FOOTER_LINKS, FEATURES, WHY_ZARNAMA, HOW_IT_WORKS, STATS, FAQS, TESTIMONIALS, TRUST_BADGES) — آماده برای CMS
- `src/lib/price/` — PriceService interface + MockPriceService — معماری `UI → Service → Provider` — جایگزینی در Phase 5

---

## SEO

- `metadataBase` + title template + description + keywords
- OpenGraph (+ تصویر پویا)، canonical در هر صفحه
- `sitemap.xml` (۸ route)، `robots.txt` (محارم api/auth/admin)
- JSON-LD: Organization + WebSite + FAQPage
- یک `h1` معنایی در هر صفحه (`titleAs` prop)
- `robots: noindex` برای login/register

## Responsive

- Mobile-first؛ منوی موبایل اختصاصی (Dialog)
- E2E روی ۳ viewport: Desktop Chrome، iPad Mini (Chromium)، Pixel 7

## Accessibility

- skip-link به `#main-content`، `aria-label` روی nav و دکمه‌های آیکون
- سلسله‌مراتب heading صحیح، semantic HTML، focus states
- `prefers-reduced-motion` — همه انیمیشن‌ها غیرفعال می‌شوند

## انیمیشن

- `float` و `fade-up` سفارشی در globals.css + `tw-animate-css` برای کامپوننت‌های Radix
- Subtle/premium — بدون انیمیشن سنگین

---

## تست‌ها

| لایه               | تعداد            | وضعیت |
| ------------------ | ---------------- | ----- |
| Unit + Integration | 28 (۸ فایل)      | ✅    |
| E2E (Playwright)   | 20 pass / 1 skip | ✅    |
| Viewportها         | ۳                | ✅    |

## Final Gate

| دستور            | نتیجه                    |
| ---------------- | ------------------------ |
| `pnpm lint`      | ✅ 0 errors / 0 warnings |
| `pnpm typecheck` | ✅ 0 errors              |
| `pnpm test`      | ✅ 28/28                 |
| `pnpm build`     | ✅ ۲۰ route + Serwist SW |

---

## مشکلات و راه‌حل‌ها

1. **OG image با متن فارسی** — satori از shaping پیچیده (GSUB lookupType 5) پشتیبانی نمی‌کند → متن لاتین
2. **iPad Mini → WebKit** — `browserName: 'chromium'` برای پروژه tablet
3. **CardTitle div بود** — به `h3` تغییر کرد (heading واقعی برای صفحات auth)
4. **h1 گم‌شده** — `titleAs` prop به Section اضافه شد
5. **`.next/types` قدیمی** — ارجاع به `src/app/page.js` حذف‌شده → پاک‌سازی `.next`

## تصمیم‌های معماری

- Mock Price هرگز Live جا زده نمی‌شود: `isLive: false` + `source: 'demo'` + برچسب UI «Demo / پیش‌نمایش» + تست e2e
- آیکون‌های PWA از SVG واحد تولید می‌شوند (`scripts/generate-icons.mjs`)
- import `cn` از package `cn` (convention جدید shadcn — replacement کامپایل‌شده clsx+tailwind-merge)
- FAQ/بلاگ از لایه داده مرکزی خوانده می‌شوند — آماده برای CMS/Admin در Phaseهای بعدی

## محدودیت‌ها / Pending

- تست PWA روی دستگاه فیزیکی (Chrome Android / Safari iOS) — همانند Phase 0
- Provider واقعی قیمت طلا — Phase 5
- منطق احراز هویت — Phase 2
- فرم تماس فعلاً mailto است — تیکتینگ در Phase بعدی

## فایل‌های مهم

- `src/app/(public)/` — ۸ صفحه + layout
- `src/app/(auth)/` — ۲ صفحه + layout
- `src/components/landing/` — ۲۰ کامپوننت
- `src/components/shared/` — Container, Section, Logo
- `src/lib/data/landing.ts`, `src/lib/price/`
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`
- `playwright.config.ts`, `tests/e2e/landing.spec.ts`
- `tests/unit/{landing-data,price-service,components}.test.ts(x)`
- `scripts/generate-icons.mjs`, `public/icons/*.png`

## Phase بعدی پیشنهادی

**Phase 2:** Authentication & User Management (OTP login/register، session، KYC پایه)
