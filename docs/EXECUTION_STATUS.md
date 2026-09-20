# Zar30 — Execution Status

> وضعیت اجرای پروژه — به‌روزرسانی شده در Phase 0 Final Gate (2026-09-18)

## Global Rebrand (ADR-017) — دائمی

**وضعیت:** ✅ DONE — هویت محصول از LEGACY «زرنما/Zarnama/zarnama.ir» به **زرسی / zar30 / zar30.com** مهاجرت کرد (۱۸۱ فایل + `.env` + Prisma Client regen). مرجع: `docs/rebranding/ZAR30-REBRAND-AUDIT.md` و `docs/architecture/ADR-ZAR30-GLOBAL-REBRANDING.md`. از این تاریخ نام برند برای همه Phaseها لازم‌الاجرا است.

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
| 1.5  | بخش‌های Landing: Hero, Price, Features, WhyZar30, HowItWorks, Stats                                       | ✅    |
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

**Phase 3:** User Panel & Profile — ✅ **DONE** (پایین را ببینید)

---

## Phase 3: User Panel & Profile

**وضعیت:** ✅ DONE — Final Gate پاس شد (Lint / Typecheck / Unit+Integration / E2E / Build)

> مرجع کامل: `docs/phases/PHASE-03-REPORT.md` — API: `docs/API.md` — امنیت: `docs/SECURITY.md`
> نکته: طبق اصلاح Roadmap، KYC به Phase 4 منتقل شد — این Phase فقط پنل کاربر و profile است.

### تسک‌ها

| #    | تسک                                                                                               | وضعیت |
| ---- | ------------------------------------------------------------------------------------------------- | ----- |
| 3.1  | User fields (firstName/lastName/email/avatarUrl) + migration                                      | ✅    |
| 3.2  | `user.service.ts`: profile/sessions/notifications/security-events — isolation کامل از userId توکن | ✅    |
| 3.3  | APIها: `/users/me`, `/users/profile`, `/users/sessions` (+[id])، notifications، security-events   | ✅    |
| 3.4  | `PanelShell`: auth gate + sidebar (desktop) + bottom nav (mobile) + user context                  | ✅    |
| 3.5  | Dashboard: welcome + status + KYC preview + دارایی/تراکنش placeholder («به‌زودی — پیش‌نمایش»)     | ✅    |
| 3.6  | Profile: مشاهده + ویرایش واقعی (PUT) — mobile/kyc/status غیرقابل تغییر                            | ✅    |
| 3.7  | Security Center: وضعیت امنیت + تغییر رمز + رویدادهای امنیتی + 2FA readiness                       | ✅    |
| 3.8  | Sessions: device/os/browser/IP/isCurrent + revoke + خروج از سایر نشست‌ها                          | ✅    |
| 3.9  | Notifications Center + Referral + Support (preview)                                               | ✅    |
| 3.10 | `parseUserAgent` — تجزیه سبک device/os/browser + تست                                              | ✅    |
| 3.11 | Tests: unit (profile validator + UA parser) + integration (isolation/IDOR) + E2E (۳ viewport)     | ✅    |

### Acceptance Criteria

| معیار                             | وضعیت                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| User Dashboard واقعی و responsive | ✅ sidebar (desktop) + bottom nav (mobile)                   |
| Profile واقعی + update واقعی      | ✅ PUT + audit PROFILE_UPDATE                                |
| Session Management واقعی          | ✅ device/browser/isCurrent                                  |
| Revoke Session واقعی              | ✅ فوری از طریق `sid` در access token                        |
| Logout All (سایر نشست‌ها) واقعی   | ✅ نشست جاری حفظ می‌شود                                      |
| Security Center                   | ✅ رمز + رویدادها + 2FA readiness                            |
| Route Protection                  | ✅ proxy + requireAuth + callbackUrl                         |
| User Isolation تست شده            | ✅ integration: session/notification کاربر دیگر → 404 (IDOR) |
| Mobile UX اختصاصی                 | ✅ bottom nav جداگانه                                        |
| هیچ داده مالی جعلی                | ✅ همه کارت‌ها «به‌زودی — پیش‌نمایش»                         |
| `pnpm lint`                       | ✅ 0 errors / 0 warnings                                     |
| `pnpm typecheck`                  | ✅ 0 errors                                                  |
| `pnpm test` (unit+integration)    | ✅ 73/73                                                     |
| `pnpm test:e2e`                   | ✅ 45 pass / 3 skip (viewport-specific)                      |
| `pnpm build`                      | ✅ ۴۶ route + Serwist                                        |

### مشکلات پیدا شده و رفع‌شده

1. **`user-agent.h` اشتباه** — فایل C++ حذف شد؛ نسخه صحیح `user-agent.ts` با کامنت فارسی
2. **کامنت‌های چینی** — در `user-agent.ts` و `user.service.ts` به فارسی اصلاح شدند
3. **`markNotificationRead` غیر idempotent** — خواندن دوباره اعلان خطا می‌داد → ابتدا بررسی مالکیت سپس update
4. **parseUserAgent: iPad = mobile** — UA واقعی iPad شامل `Mobile/` است → ترتیب بررسی tablet قبل از mobile
5. **E2E rate limit روی register** — ۱۵ ثبت‌نام موازی از limit ۱۰/ساعت گذشت → ساخت کاربر تست از service layer (rate limit در لایه route است)
6. **E2E strict mode** — موبایل/نام هم در sidebar مخفی و هم main دیده می‌شد → scope به `main`
7. **`dashboard-client.tsx` قدیمی** — فایل بدون ارجاع Phase 2 حذف شد
8. **`DATABASE_URL` در Playwright runner** — `dotenv/config` به playwright.config اضافه شد

### تصمیم‌های کلیدی

- **همه صفحات پنل زیر `/dashboard/*`** — proxy موجود Phase 2 بدون تغییر همه را محافظت می‌کند
- **`PanelShell` client-side auth gate** — با `apiGetWithRefresh`؛ proxy در لایه edge هم redirect می‌کند (دفاع دولایه)
- **`user.service.ts` جدا از `auth.service.ts`** — دامنه users مستقل؛ session helpers مشترک از `lib/auth/session`
- **نشست جاری در revoke-others حفظ می‌شود** — `revokeAllOtherSessions(userId, keepSid)`
- **اعلان‌ها idempotent** — mark-read دوباره خطا نمی‌دهد؛ مالکیت با `findFirst({id, userId})`
- **E2E کاربر ایزوله per test** — از service layer ساخته می‌شود تا rate limit route و تداخل موازی اثر نگذارد

### Phase بعدی

**Phase 4:** KYC — احراز هویت (workflow، document upload، verification، review) — آماده شروع

---

## Phase 3.1: Navigation Lock & Premium UI/UX Redesign

**وضعیت:** ✅ DONE — Final Gate پاس شد (Lint / Typecheck / Unit+Integration / E2E / Build)

> مرجع کامل: `docs/phases/PHASE-3.1-REPORT.md` — قرارداد nav: `src/config/navigation.ts` + `docs/ARCHITECTURE_DECISIONS.md` (ADR-015)

### تسک‌ها

| #      | تسک                                                                                                      | وضعیت |
| ------ | -------------------------------------------------------------------------------------------------------- | ----- |
| 3.1.1  | `src/config/navigation.ts` — قرارداد دائمی ۵ مقصدی (خانه، معاملات، دارایی، قسطی، پروفایل) + active match | ✅    |
| 3.1.2  | Design Tokens کامل در `globals.css` — navy/gold، surfaces چندلایه dark/light، shadow، motion، type       | ✅    |
| 3.1.3  | کامپوننت‌های مالی: BalanceCard، PriceTicker، TransactionItem، OrderCard، QuoteCard، PortfolioChart، ...  | ✅    |
| 3.1.4  | UI primitives: Button (gold/success)، Skeleton shimmer، EmptyState، ErrorState، StatusBadge، DataTable   | ✅    |
| 3.1.5  | `PanelShell` جدید — sidebar premium + bottom nav ۵‌آیتمی + header + bell + safe-area + skeleton          | ✅    |
| 3.1.6  | صفحات جدید: `/dashboard/trade`، `/assets`، `/installments` (preview/empty، بدون financial logic)         | ✅    |
| 3.1.7  | انتقال security/sessions/referral/support زیر `/dashboard/profile/*` + redirect مسیرهای قدیمی            | ✅    |
| 3.1.8  | Redesign همه صفحات موجود با design system جدید                                                           | ✅    |
| 3.1.9  | صفحه `/design-system` — preview کامپوننت‌ها و stateها                                                    | ✅    |
| 3.1.10 | E2E «Navigation Contract» — ۵ آیتم + ترتیب + desktop/mobile از یک IA                                     | ✅    |
| 3.1.11 | Accessibility smoke tests (landmark، h1، label، focus، aria-current)                                     | ✅    |

### Acceptance Criteria

| معیار                                          | وضعیت                                           |
| ---------------------------------------------- | ----------------------------------------------- |
| 5-item navigation دقیقاً مطابق قرارداد         | ✅ `PANEL_NAV_ITEMS` + E2E contract test        |
| Desktop و Mobile یک IA                         | ✅ هر دو از یک config مرکزی                     |
| Navigation config مرکزی                        | ✅ `src/config/navigation.ts`                   |
| E2E contract test                              | ✅ ۲ تست در `panel.spec.ts`                     |
| Design System جدید                             | ✅ token-based کامل در `globals.css`            |
| تمام صفحات موجود redesign                      | ✅ dashboard، profile، security، sessions، ...  |
| Animation System                               | ✅ token motion + reduced-motion + count-up     |
| Skeleton/Empty/Error                           | ✅ کامپوننت‌های اختصاصی                         |
| Accessibility                                  | ✅ smoke tests + h1 در همه صفحات + aria-current |
| `pnpm lint` / `typecheck` / `test`             | ✅ 0 / 0 / 73 pass                              |
| `pnpm test:e2e`                                | ✅ ۵۹ pass (۳ viewport)                         |
| `pnpm build`                                   | ✅ موفق                                         |
| Docs: AGENTS + MEGAPLAN + ADR + STATUS + گزارش | ✅ ADR-015 + PHASE-3.1-REPORT                   |

### مشکلات پیدا شده و رفع‌شده

1. **E2E ناپایدار (bcrypt CPU-bound)** — `bcryptjs` با cost ۱۲ روی نود تک‌نخی زیر ۶ worker موازی، سرور تست را خفه می‌کرد (ECONNREFUSED) → `BCRYPT_COST=10` فقط برای e2e در `playwright.config.ts` + workers=4 + retry=1 (مقدار production در `.env` همان ۱۲ است)
2. **Strict mode روی «معاملات»** — `تاریخچه معاملات` substring match می‌شد → `exact: true`
3. **nav مخفی در getByRole** — تست IA دو nav نمی‌توانست هر دو را هم‌زمان ببیند → CSS locator روی `nav[aria-label]`
4. **صفحات auth بدون h1** — `CardTitle` (h3) به `h1` تبدیل شد در ۵ صفحه auth
5. **خروج از حساب** — با حذف دکمه از header موبایل، دکمه خروج به profile hub منتقل شد

### Phase بعدی

**Phase 4:** KYC — پس از تایید گزارش Phase 3.1 توسط کاربر شروع می‌شود

---

## Full User Panel Redesign (ADR-019) — 2026-09-20

**وضعیت:** ✅ DONE — بازطراحی کامل UX/UI پنل کاربری (بدون تغییر Business Logic / Navigation Contract)

| بخش           | تغییر                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard     | Wealth Hero (`.surface-wealth` + `gold-rings`) — ارزش کل + طلا/ریال + badge وضعیت؛ Quick Actions؛ ویجت قیمت با ساختار خرید/فروش؛ نمودار روند (داده نمایشی برچسب‌دار) |
| PanelShell    | سایدبار premium (eyebrow + nav طلایی + کارت کاربر)؛ Header context-aware (عنوان + تاریخ + آواتار + bell)؛ Bottom Nav؛ `animate-page-in`                              |
| Sessions      | جدول premium دسکتاپ + کارت موبایل + خلاصه نشست جاری                                                                                                                  |
| Notifications | فیلتر tablist + آیکون دسته‌بندی                                                                                                                                      |
| Profile       | Identity Header با آواتار halo طلایی                                                                                                                                 |
| Security      | Overview Strip                                                                                                                                                       |
| Referral      | کد + لینک + آمار پیش‌نمایش                                                                                                                                           |
| Support       | Help Center (۴ دسته)                                                                                                                                                 |
| Tokens        | `--shadow-glow`، `.surface-wealth`، `.gold-rings`، `animate-page-in`                                                                                                 |

**Verification:** typecheck ✅ / lint ✅ / unit+integration ۷۳ ✅ / E2E (panel+a11y) ✅ / build ✅ / Visual QA با screenshot ۱۴۴۰ و ۳۹۰ ✅

---

## Phase 4 — KYC & Identity Verification (ADR-020) — 2026-09-20

**وضعیت:** ✅ DONE — احراز هویت سطح ۲ (core flow) — گزارش کامل: `docs/phases/PHASE-04-REPORT.md`

| بخش           | نتیجه                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Flow          | wizard ۵‌مرحله‌ای در `/dashboard/profile/kyc` (زیر «پروفایل» — nav contract دست‌نخورده)                        |
| State machine | `NOT_STARTED→IN_PROGRESS→SUBMITTED→UNDER_REVIEW→APPROVED/REJECTED/NEEDS_RESUBMISSION` سروری                    |
| DB            | `kyc_submissions` گسترش‌یافته (draft سروری + فیلدهای بانکی enc) + `kyc_documents` — migration `20260920061737` |
| API           | `/api/v1/kyc/*` (status/start/draft/documents/submit) + `/api/v1/admin/kyc/*` (queue/claim/review)             |
| امنیت         | AES-256-GCM (فایل + فیلدهای بانکی)، S3 private، MIME sniff، IDOR 404، rate limit، audit کامل                   |
| تست           | ۱۲ unit + ۸ integration (DB+MinIO واقعی) + ۴ E2E × ۳ viewport                                                  |

**خارج از دامنه:** سطح ۳ (ویدیو/face-match/OCR)، Admin Review UI، operation limits بر اساس kycLevel — Phaseهای بعدی.

**Verification:** lint ✅ / typecheck ✅ / test 93/93 ✅ / e2e (kyc+auth+panel) ✅ / build ✅

---

## Permanent Design Language — ثبت قانون دائمی (2026-09-19)

**ADR-016: Zar30 Navy Luxury Design Language** — از این تاریخ برای **تمام Phaseهای بعدی و همه platformها** (User Panel، Admin، Landing، PWA، Android/iOS) لازم‌الاجرا است.

- امضای بصری: **«Luxury Private Banking for Gold»**
- اولویت رنگ: **Navy → Primary** · **Gold → Luxury Accent** · **Cream → Supporting Accent** · Neutral → text/border
- **Dark/Navy-First:** `:root` = navy، `<html class="dark">`؛ light فقط opt-in با `.light`
- Token-based اجباری — hardcode رنگ/style در کامپوننت ممنوع؛ تغییر بنیادی فقط با ADR
- Source of Truth: `src/app/globals.css` (tokens) + `/design-system` (preview) + `AGENTS.md › PERMANENT ZAR30 DESIGN LANGUAGE`
- Anti-patterns: white/cream-first، neon crypto، excessive glass/glow، generic SaaS/Bootstrap look — ممنوع
