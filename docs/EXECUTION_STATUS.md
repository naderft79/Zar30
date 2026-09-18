# Zarnama — Execution Status

> وضعیت اجرای پروژه — به‌روزرسانی شده در Phase 0 Final Gate (2026-09-18)

## Phase 0: Setup & Infrastructure + PWA Spike

**وضعیت:** ✅ DONE — Final Gate پاس شد (Docker / PostgreSQL / Redis / MinIO / Lint / Tests / Build)

> مرجع کامل: `docs/phases/PHASE-00-VALIDATION-CHECKLIST.md` و `docs/phases/PHASE-00-REPORT.md`

### تسک‌ها

| #    | تسک                                     | وضعیت | توضیح                                                                                                                                    |
| ---- | --------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1  | Node.js 24 LTS + pin                    | ✅    | `.nvmrc` = `24`، Node 24.21.0 LTS نصب و verify شد                                                                                        |
| 0.2  | Next.js 16.3.3 + Turbopack              | ✅    | پروژه ساخته شد — build با Turbopack موفق                                                                                                 |
| 0.3  | وابستگی‌ها                              | ✅    | Prisma 7.10.0, ioredis, bullmq, socket.io, zod, jose, bcryptjs, zustand, tanstack-query, recharts, sonner, lucide, react-hook-form, pino |
| 0.4  | ESLint + Prettier + Husky + lint-staged | ✅    | eslint.config.mjs (flat config) — **0 errors / 0 warnings**                                                                              |
| 0.5  | ساختار پوشه‌ها                          | ✅    | طبق MEGAPLAN بخش ۳۰                                                                                                                      |
| 0.6  | Tailwind v4 + پالت navy/gold/cream      | ✅    | Design tokens در globals.css + تم تیره                                                                                                   |
| 0.7  | Vazirmatn + RTL                         | ✅    | next/font + dir="rtl" + lang="fa"                                                                                                        |
| 0.8  | Prisma 7 + schema پایه                  | ✅    | Double-Entry Ledger + Asset Accounts + Idempotency + RateLimitConfig — migrate deploy + seed روی PostgreSQL 18.6 واقعی                   |
| 0.9  | docker-compose                          | ✅    | PostgreSQL 18.6 + Redis 7.4.11 + MinIO (quay.io) — هر ۳ سرویس healthy                                                                    |
| 0.10 | Capacitor init                          | ✅    | Android platform اضافه شد — دو Target (Web + Mobile)                                                                                     |
| 0.11 | PWA Spike                               | ✅    | @serwist/turbopack — production build موفق — 20 precache entries                                                                         |
| 0.12 | .env.example + README + docs            | ✅    | .env.example + docs/ فایل‌ها                                                                                                             |

### Acceptance Criteria

| معیار                            | وضعیت                                                                       |
| -------------------------------- | --------------------------------------------------------------------------- |
| `pnpm dev` با Turbopack اجرا شود | ✅                                                                          |
| `pnpm lint` pass                 | ✅ **0 errors / 0 warnings** (331 error رفع شد — generated code در ignores) |
| `pnpm typecheck` pass            | ✅                                                                          |
| `pnpm test` pass                 | ✅ 16/16 (11 unit + 5 integration روی DB واقعی)                             |
| `pnpm build` موفق                | ✅ Turbopack + Serwist 20 precache entries                                  |
| ساختار پوشه‌ها مطابق MEGAPLAN    | ✅                                                                          |
| پالت رنگی + فونت Vazirmatn + RTL | ✅                                                                          |
| Prisma 7 schema + migrate + seed | ✅ migrate deploy روی PostgreSQL 18.6 — بدون drift — seed موفق              |
| `.nvmrc` با `24`                 | ✅ Node 24.21.0 LTS نصب و فعال                                              |
| PWA Spike نتایج ثبت شده          | ✅ (در ADR-009) — ⏳ تست‌های دستگاه واقعی Pending                           |
| docker compose بالا بیاید        | ✅ هر ۳ سرویس healthy — pg_isready / PONG / MinIO 200                       |
| `npx cap` کار کند                | ✅ — Mobile Runtime Validation به Phase 18 موکول شد                         |

### Database Validation (روی PostgreSQL 18.6 واقعی)

| بررسی                | نتیجه                                                                |
| -------------------- | -------------------------------------------------------------------- |
| Tables               | ✅ ۳۱ جدول (۳۰ app + `_prisma_migrations`)                           |
| Foreign Keys         | ✅ ۳۱ FK (RESTRICT روی ledger)                                       |
| Indexes              | ✅ ۸۵ index (۴۴ unique)                                              |
| CHECK Constraints    | ✅ ۲۱۲ (enum + check)                                                |
| Migration Integrity  | ✅ `migrate status`: up to date                                      |
| Double-Entry Balance | ✅ تست تراز Debit/Credit pass                                        |
| Transaction Rollback | ✅ rollback کامل verify شد                                           |
| Idempotency Unique   | ✅ unique key constraint فعال                                        |
| FK RESTRICT          | ✅ ورودی بدون journal معتبر رد می‌شود                                |
| Seed                 | ✅ ledger accounts + rate limits + feature flags + plans + test user |

### موارد Pending (غیر مسدودکننده Phase 0)

1. **PWA تست دستگاه واقعی** — Android Chrome / iOS Safari / Installability / Push (نیازمند دستگاه فیزیکی)
2. **Mobile Runtime Validation** — Android build/emulator در Phase 18
3. **MinIO image pinning** — برای Production نسخه `latest` باید Pin شود
4. **Business Decisions** — Spread / Fees / Limits و… (PENDING BUSINESS DECISION)

### مشکلات پیدا شده (حل شده)

1. ~~**Docker نصب نیست**~~ → Docker Desktop در مسیر user-local پیدا شد (`AppData\Local\Programs\DockerDesktop`) — Docker 29.8.0 / Compose v5.5.1
2. ~~**Node.js محلی v22**~~ → Node 24.21.0 LTS نصب شد (`C:\Users\NADFER\nodejs24`)
3. **Prisma 7 Driver Adapter** — نیاز به `@prisma/adapter-pg` بود (در seed.ts هم اصلاح شد)
4. **middleware → proxy** — Next.js 16 convention تغییر کرده
5. **@serwist/next با Turbopack ناسازگار** — به `@serwist/turbopack` مهاجرت شد
6. **minio/minio آرشیو** — به `quay.io/minio/minio` مهاجرت شد
7. **PostgreSQL 18+ volume path** — mount به `/var/lib/postgresql` (نه `/data`)
8. **331 lint errors** — `src/generated/**` به eslint ignores اضافه شد

### تصمیم‌های جدید

- استفاده از `@serwist/turbopack` به جای `@serwist/next` (سازگاری Turbopack)
- Prisma client در `src/generated/prisma` (به جای `node_modules/.prisma`)
- proxy.ts به جای middleware.ts (Next.js 16 convention)
- MinIO از `quay.io` (Docker Hub image آرشیو شده)
- Redis client بدون `lazyConnect` (اتصال فعال + offline queue غیرفعال)

## Phase بعدی

**Phase 1:** Landing Page — ✅ **UNBLOCKED** — آماده شروع

---

## Phase 1: Landing & Public Website

**وضعیت:** ✅ DONE — Final Gate پاس شد (Lint / Typecheck / Unit / E2E / Build)

> مرجع کامل: `docs/phases/PHASE-01-REPORT.md`

### تسک‌ها

| #    | تسک                                                                                                       | وضعیت |
| ---- | --------------------------------------------------------------------------------------------------------- | ----- |
| 1.1  | Route group `(public)` + layout (Header/Footer/skip-link)                                                 | ✅    |
| 1.2  | Design System: Container, Section (+titleAs), Logo, Accordion, Dialog, Tooltip                            | ✅    |
| 1.3  | داده‌های Landing + Price Service Interface (Mock/Dev با برچسب Demo)                                       | ✅    |
| 1.4  | Header + Mobile Menu (Dialog) + Footer                                                                    | ✅    |
| 1.5  | بخش‌های Landing: Hero, Price, Features, WhyZarnama, HowItWorks, Stats                                     | ✅    |
| 1.6  | بخش‌های Landing: Calculator, Investment, Installment, Security, Physical, Referral, FAQ, CTA, DownloadApp | ✅    |
| 1.7  | صفحات Public: about, security, faq, contact, blog, terms, privacy + auth placeholders                     | ✅    |
| 1.8  | SEO: metadataBase, sitemap.xml, robots.txt, OG image, JSON-LD، canonical، h1 هر صفحه                      | ✅    |
| 1.9  | Animations (float/fade-up) + prefers-reduced-motion + PWA icons (PNG)                                     | ✅    |
| 1.10 | Tests: unit (12) + Playwright E2E (desktop/tablet/mobile)                                                 | ✅    |

### Acceptance Criteria

| معیار                                                        | وضعیت                                 |
| ------------------------------------------------------------ | ------------------------------------- |
| Landing کامل (۱۴ بخش — پس از Cleanup Social Proof)           | ✅ تعداد واقعی از Source: `page.tsx`  |
| RTL + Vazirmatn + پالت navy/gold/cream                       | ✅                                    |
| Responsive (mobile/tablet/desktop — Playwright)              | ✅ ۳ پروژه viewport                   |
| Design System بدون duplicate                                 | ✅                                    |
| Mobile UX (منوی Dialog مخصوص موبایل)                         | ✅                                    |
| SEO پایه (metadata/OG/sitemap/robots/JSON-LD/h1)             | ✅                                    |
| Accessibility (skip-link، semantic h1، aria، reduced-motion) | ✅                                    |
| `pnpm build` موفق                                            | ✅ ۲۰ route تولید شد                  |
| `pnpm typecheck`                                             | ✅ 0 errors                           |
| `pnpm lint`                                                  | ✅ 0 errors / 0 warnings              |
| `pnpm test` (unit+integration)                               | ✅ 28/28                              |
| `pnpm test:e2e` (Playwright)                                 | ✅ 20 pass / 1 skip (mobile-only)     |
| هیچ Mock مالی به‌عنوان Live نمایش داده نشود                  | ✅ برچسب «Demo / پیش‌نمایش» + تست e2e |
| Public Routing درست                                          | ✅ ۸ صفحه + ۲ auth placeholder        |
| PWA Foundation خراب نشده                                     | ✅ Serwist + manifest + آیکون‌های PNG |
| Financial Core دست‌نخورده                                    | ✅ فقط Presentation                   |

### مشکلات پیدا شده و رفع‌شده

1. **satori متن فارسی** — `opengraph-image` با فارسی خطای `lookupType 5` داد → متن لاتین در OG image (محدودیت shaping در satori)
2. **iPad Mini → WebKit** — پروژه tablet روی Chromium تنظیم شد (نصب WebKit لازم نبود)
3. **CardTitle = div** — به `h3` و CardDescription به `p` تغییر کرد (معناشناسی heading)
4. **h1 در صفحات public** — prop `titleAs` به Section اضافه شد؛ هر صفحه یک h1 دارد
5. **cache قدیمی `.next/types`** — با پاک‌سازی `.next` رفع شد

### تصمیم‌های جدید

- `cn` package (shadcn-ui/cn) به‌جای clsx+tailwind-merge در importهای `from 'cn'` — convention جدید shadcn
- `titleAs` prop در Section برای کنترل معنایی h1/h2
- OG image با متن لاتین (محدودیت satori در shaping فارسی)
- آیکون‌های PWA از `public/icon.svg` با اسکریپت `scripts/generate-icons.mjs` (sharp) تولید می‌شوند
- Mock Price فقط با `isLive: false` + `source: 'demo'` — جایگزینی Provider واقعی در Phase 5

## Phase بعدی

**Phase 2:** Authentication & User Management — ✅ **DONE** (پایین را ببینید)

### Cleanup پس از APPROVE Phase 1 (2026-09-18)

1. **شمارش Sectionها** — تعداد واقعی از `src/app/(public)/page.tsx` استخراج شد: ۱۵ بخش در نسخه اصلی؛ پس از حذف Testimonials = **۱۴ بخش**. (گزارش قبلی «۱۵» برای ترکیب قبلی درست بود؛ `GoldCalculator` Section مستقل نیست و داخل `PriceSection` است.)
2. **حذف Fake Social Proof** — بخش `Testimonials` (۴ نظر جعلی) و آمار ساختگی (`+۵۰,۰۰۰ کاربر`، `+۱۲۰ کیلوگرم`، `+۱ میلیون تراکنش`) حذف شدند؛ `STATS` با قابلیت‌های واقعی محصول جایگزین شد. Price Widget با برچسب «Demo / پیش‌نمایش» صحیح باقی ماند.

---

## Phase 2: Authentication & User Management

**وضعیت:** ✅ DONE — Final Gate پاس شد (Lint / Typecheck / Unit+Integration / E2E / Build)

> مرجع کامل: `docs/phases/PHASE-02-REPORT.md` — امنیت: `docs/SECURITY.md` — API: `docs/API.md`

### تسک‌ها

| #    | تسک                                                                                                          | وضعیت |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----- |
| 2.1  | Auth Service: register/login/logout/refresh/OTP/password + `authService` export                              | ✅    |
| 2.2  | JWT: access (۱۵m، حاوی `sid`) + refresh (۳۰d، rotation + reuse detection) — Web cookie/Mobile Bearer         | ✅    |
| 2.3  | OTP: server-side، هش با pepper، TTL، attempts، resend cooldown، replay resistant                             | ✅    |
| 2.4  | Session: DB-backed، list/revoke، revoke بلافاصله روی access token اثر می‌کند (`sid` claim)                   | ✅    |
| 2.5  | Password: forgot/reset (OTP → revoke همه نشست‌ها) + change (authenticated)                                   | ✅    |
| 2.6  | Rate Limiting: `RateLimitConfig` — otp.send/otp.verify/auth.login/auth.register/password_reset + api.general | ✅    |
| 2.7  | RBAC foundation: Role/Permission + `hasPermission` + User/Admin                                              | ✅    |
| 2.8  | Brute force: failedLoginAttempts + lockedUntil — پیام generic                                                | ✅    |
| 2.9  | SMS Provider interface: Mock (SMS_PROVIDER=mock) + Kavenegar — انتخاب با env                                 | ✅    |
| 2.10 | UI: login/register/verify-otp/forgot-password/reset-password/dashboard+sessions — RTL                        | ✅    |
| 2.11 | Proxy: redirect به `/login` + حفظ callbackUrl + پذیرش refresh cookie                                         | ✅    |
| 2.12 | Audit: رویدادهای auth در `audit_logs` با actor/ip/userAgent                                                  | ✅    |
| 2.13 | Dev endpoint: `GET /api/v1/dev/otp/[mobile]` — فقط `DEV_OTP_ENDPOINT=true` + `SMS_PROVIDER=mock`             | ✅    |
| 2.14 | Tests: unit + integration (DB واقعی) + E2E (۳ viewport)                                                      | ✅    |

### Acceptance Criteria

| معیار                          | وضعیت                                         |
| ------------------------------ | --------------------------------------------- |
| Registration واقعی             | ✅                                            |
| OTP واقعی در Development       | ✅ Mock SMS + dev endpoint                    |
| Login واقعی                    | ✅                                            |
| Session درست مدیریت شود        | ✅ DB + rotation + revocation فوری            |
| Logout واقعی (idempotent)      | ✅                                            |
| Session Revocation             | ✅ تست e2e: revoke → 401                      |
| Rate Limiting کار کند          | ✅ configurable از DB                         |
| Authorization server-side      | ✅ requireAuth + RBAC                         |
| User data isolation تست شده    | ✅ integration: revoke نشست کاربر دیگر → 404  |
| Security tests pass            | ✅ brute force/replay/expired/reuse/isolation |
| Mobile/Auth architecture آماده | ✅ Bearer + cookie — همان API                 |
| `pnpm lint`                    | ✅ 0 errors / 0 warnings                      |
| `pnpm typecheck`               | ✅ 0 errors                                   |
| `pnpm test` (unit+integration) | ✅ 50/50                                      |
| `pnpm test:e2e`                | ✅ 35 pass / 1 skip (mobile-only)             |
| `pnpm build`                   | ✅ ۳۵ route + Serwist                         |

### تصمیم‌های کلیدی

- **`sid` در access token** — revoke شدن Session بدون انتظار انقضای JWT بلافاصله اثر می‌کند
- **Refresh rotation + reuse detection** — token قدیمی دوباره استفاده شود، همه نشست‌ها revoke می‌شوند
- **OTP/Password هر دو pepper جداگانه** — فقط در env، نه DB
- **SMS_PROVIDER انتخاب provider را کنترل می‌کند** (نه NODE_ENV) — production واقعی `kavenegar`
- **Dev OTP endpoint دو شرط دارد** (`DEV_OTP_ENDPOINT=true` + `SMS_PROVIDER=mock`) — در production هرگز فعال نمی‌شود
- **Proxy refresh cookie را می‌پذیرد** — صفحه محافظت‌شده لود می‌شود، کلاینت refresh می‌کند، ناموفق → login

### Phase بعدی

**Phase 3:** KYC & User Profile — آماده شروع
