# ZAR30 Global Rebrand — Audit Report

> **LEGACY:** نام‌های «زرنما / Zarnama / ZarNama / zarnama / zarnama.ir» در این سند صرفاً برای مستندسازی Migration ذکر شده‌اند و از این پس Deprecated هستند.

تاریخ: ۲۰۲۵ — Migration یک‌مرحله‌ای و Forward-only (بدون بازنویسی تاریخچه Git)

## خلاصه

- برند قدیمی (LEGACY): زرنما / Zarnama / ZarNama / zarnama / zarnama.ir
- برند جدید: **زرسی / zar30**
- دامنه جدید: **https://zar30.com**
- حجم تغییر: ۱۸۱ فایل tracked + `.env` محلی + ۲ rename ساختاری

## دسته‌بندی Referenceهای پیدا و مهاجرت‌شده

### UI / Display Text

- متن لوگو، هدر، فوتر، صفحات auth، پنل، landing → «زرسی»
- `WHY_ZARNAMA` → `WHY_ZAR30`؛ `WhyZarnama` → `WhyZar30`؛ فایل `why-zarnama.tsx` → `why-zar30.tsx` (git mv)
- SVG gradient id `zarnama-gold` → `zar30-gold` در `logo.tsx` و `public/icon.svg`

### Code / Identifiers

- کامنت header `// Zarnama - ...` در ~۱۵۰ فایل → `// Zar30 - ...`
- `src/lib/errors/api-error.ts` — URLهای RFC 7807 `https://zarnama.ir/errors/*` → `https://zar30.com/errors/*`

### Authentication / JWT / Cookies

- `ACCESS_COOKIE`: `zarnama_access` → `zar30_access`
- `REFRESH_COOKIE`: `zarnama_refresh` → `zar30_refresh`
- `src/proxy.ts` — خواندن cookieها به‌روز شد
- `JWT_ISSUER` default: `zarnama` → `zar30`
- `JWT_AUDIENCE` default: `zarnama-users` → `zar30-users`
- Mobile storage key: `zarnama_refresh_token` → `zar30_refresh_token`
- ⚠️ اثر: sessionهای قبلی با cookie قدیمی نامعتبر می‌شوند — قابل‌قبول در مرحله Development (هنوز کاربر production وجود ندارد)

### Database / Prisma

- Schema: فقط کامنت header — هیچ Model/Enum/Constraint برندمحور وجود نداشت
- `DATABASE_URL`: `postgresql://zar30:zar30_dev_password@localhost:5432/zar30_dev`
- POSTGRES_USER/DB: `zar30` / `zar30_dev`
- Prisma Client بازتولید شد (`pnpm db:generate`)
- ⚠️ Dev database باید با `docker compose down -v && docker compose up -d` بازسازی شود

### Redis

- هیچ key prefix برندمحوری در کد وجود نداشت — namespaceها (`otp:*`, `ratelimit:*` و…) عمومی‌اند و دست‌نخورده ماندند

### Infrastructure / Docker

- Containers: `zar30-postgres` / `zar30-redis` / `zar30-minio`
- MinIO credentials + `S3_BUCKET`: `zar30`
- CI (`ci.yml`): کامنت header — متغیرهای env تست عمومی‌اند

### Mobile / Capacitor / Android

- `appId`: `ir.zarnama.app` → `com.zar30.app` (⚠️ تغییر App ID یعنی اپ جدید در store — به‌عنوان اپ قبلی به‌روزرسانی نمی‌شود؛ در مرحله pre-release قابل‌قبول است)
- `appName` / `app_name` / `title_activity_main`: «زرسی»
- `namespace` + `applicationId`: `com.zar30.app`
- `MainActivity.java`: `package com.zar30.app` + انتقال `java/ir/zarnama/app` → `java/com/zar30/app`
- iOS: هنوز پروژه‌ای وجود ندارد — معماری با `com.zar30.app` تنظیم شد

### PWA / Service Worker

- `manifest.json`: name «زرسی - …»، short_name «زرسی»، id `com.zar30.app`
- SW cache names عمومی‌اند (`api-cache`، `image-cache`، `font-cache`) — بدون برند

### SEO / Metadata

- `layout.tsx`: title «زرسی»، template، keywords (`zar30`)، authors، OG، appleWebApp title، metadataBase → `zar30.com`
- `(public)/page.tsx`: metadata + JSON-LD (Organization/WebSite → زرسی / zar30.com)
- `robots.ts` / `sitemap.ts`: BASE_URL default → `https://zar30.com`
- `opengraph-image.tsx`: متن `Zar30` + alt

### Notifications / SMS / Email

- Seed templates: «کد تایید زرسی»، «ورود به حساب زرسی»
- ⚠️ Kavenegar template name: `zarnama-otp` → `zar30-otp` — **قالب جدید باید در پنل Kavenegar ثبت/تایید شود** (اقدام دستی)
- `VAPID_SUBJECT`: `mailto:admin@zar30.com`

### Logging / Analytics

- pino base: `app: 'zar30'`
- Sentry/PostHog: پیکربندی نشده‌اند — در Phaseهای بعد با `zar30` تنظیم می‌شوند

### Tests

- `landing.spec.ts`: title `/زرسی/`، headingهای «ورود به زرسی» / «ثبت‌نام در زرسی»
- `components.test.tsx`: متن لوگو «زرسی»
- Seed `referralCode`: `ZARNAMA1` → `ZAR301`

### Package / Scripts

- `package.json`: name `zar30`، description به‌روز شد
- `.gitignore` کامنت، `scripts/generate-icons.mjs` کامنت

### Documentation

- `AGENTS.md`، `MEGAPLAN.md`، `EXECUTION-MASTER-PROMPT.md`، `EXECUTION_STATUS.md`، `docs/*`، `README.md`، گزارش‌های Phase — همه به برند جدید مهاجرت کردند
- `PERMANENT BRAND IDENTITY` به `AGENTS.md` اضافه شد
- ADR-017 در `docs/ARCHITECTURE_DECISIONS.md` + `docs/architecture/ADR-ZAR30-GLOBAL-REBRANDING.md`

### Git / Repository

- Commit forward-only؛ بدون rewrite
- ⚠️ تغییر نام GitHub Repository (`ZarNama` → `zar30`) نیازمند دسترسی مالک — وضعیت در گزارش نهایی ثبت می‌شود
- پوشه محلی `D:\ZarNama` — تغییر نام به `D:\zar30` اختیاری/دستی (خارج از scope خودکار)

## Legacy References باقی‌مانده (عمدی)

- این سند + ADR-017 + CHANGELOG — با برچسب LEGACY
- `src/generated/prisma/*` — بازتولید شد
- تاریخچه Git (commit messages قدیمی) — دست‌نخورده طبق قرارداد
