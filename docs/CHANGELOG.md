# Zar30 — Changelog

## [0.4.0] — Global Rebranding & Technical Namespace Migration (ADR-017)

### Changed

- **هویت دائمی محصول:** LEGACY «زرنما / Zarnama / zarnama.ir» → **زرسی / zar30 / zar30.com** — مهاجرت سراسری ۱۸۱ فایل tracked + `.env`
- **Package:** `zarnama` → `zar30`
- **Auth namespace:** cookies `zar30_access` / `zar30_refresh`، JWT iss `zar30` / aud `zar30-users`، mobile storage key `zar30_refresh_token` — sessionهای قدیمی نامعتبر می‌شوند (Development)
- **Infrastructure:** containers `zar30-postgres/redis/minio`، dev DB `zar30_dev` / user `zar30`، S3 bucket `zar30`
- **Mobile:** `appId`/`applicationId`/`namespace` = `com.zar30.app`، app name «زرسی»، انتقال پکیج Java به `com.zar30.app`
- **PWA:** manifest name «زرسی»، id `com.zar30.app`
- **SEO:** metadata/JSON-LD/robots/sitemap → `zar30.com` + «زرسی»
- **Naming:** `why-zarnama.tsx` → `why-zar30.tsx`، `WHY_ZAR30`، `WhyZar30`، gradient id `zar30-gold`
- **Docs:** `PERMANENT BRAND IDENTITY` در AGENTS.md + ADR-017 + `docs/rebranding/ZAR30-REBRAND-AUDIT.md`

### Notes

- قالب Kavenegar `zar30-otp` باید در پنل Kavenegar ثبت شود (اقدام دستی)
- Dev database باید با `docker compose down -v && docker compose up -d` بازسازی و migrate/seed شود

## [0.3.1] — Phase 3.1: Navigation Lock & Premium UI/UX Redesign (2026-09-19)

### Added

- **Permanent Navigation Contract** — `src/config/navigation.ts`: دقیقاً ۵ مقصد (خانه، معاملات، دارایی، قسطی، پروفایل) به‌عنوان source of truth واحد برای sidebar دسکتاپ و bottom nav موبایل + `isNavItemActive` برای nested routes (ADR-015)
- **Premium Design Tokens** — palette کامل navy/gold در `globals.css`: surfaces چندلایه (app/sidebar/card/elevated/modal/input) برای dark و light، shadows، radius، spacing، typography، motion (duration/easing)، z-index، breakpoints
- **Financial Components** (`src/components/financial/`): FinancialNumber (count-up)، BalanceCard، PriceTicker، TransactionItem، OrderCard، QuoteCard، PortfolioChart، StatusCard، TrendBadge
- **UI Primitives**: Button variantهای `gold`/`success`، Skeleton shimmer، EmptyState، ErrorState، StatusBadge، DataTable responsive (دسکتاپ جدول → موبایل کارت)
- **صفحات جدید** — `/dashboard/trade`، `/dashboard/assets`، `/dashboard/installments` (preview/empty — بدون financial logic)
- **Profile hub** — `/dashboard/profile` + زیرمسیرها: `security`، `sessions`، `referral`، `support`؛ مسیرهای قدیمی redirect می‌شوند
- **`/design-system`** — صفحه preview کامپوننت‌ها و stateها
- **`src/lib/utils/format.ts`** — `toPersianDigits`، `formatToman`، `formatGoldGrams`، `formatPercentChange`، `formatAmount`
- **Accessibility smoke tests** — `tests/e2e/a11y.spec.ts` (landmark، h1، label، focus، aria-current)
- **E2E Navigation Contract** — دو تست در `panel.spec.ts` که قرارداد ۵‌آیتمی و یکسان بودن IA را روی desktop/tablet/mobile قفل می‌کنند

### Changed

- `PanelShell` بازنویسی — sidebar navy premium + bottom nav با safe-area + header با notification bell + skeleton loading + logout از طریق context
- همه صفحات پنل (dashboard، profile، security، sessions، notifications، referral، support) با design system جدید redesign شدند
- دکمه «خروج از حساب» به profile hub منتقل شد (طبق قرارداد nav)
- `Logo` — prop اختیاری `textClassName` برای خوانایی روی surface تیره

### Fixed

- **E2E ناپایدار** — bcryptjs (CPU-bound) با cost ۱۲ زیر بار موازی، سرور تست را کرش می‌کرد → `BCRYPT_COST=10` فقط برای e2e در `playwright.config.ts` + `workers: 4` + `retries: 1` محلی
- صفحات auth (`login`، `register`، `verify-otp`، `forgot-password`، `reset-password`) `h1` نداشتند → `CardTitle` به `h1`
- Strict-mode violation روی heading «معاملات» و «دارایی» → `exact: true` در تست‌ها

### Validated

- `pnpm lint`: 0 errors / 0 warnings
- `pnpm typecheck`: 0 errors
- `pnpm test`: 73/73 (unit + integration)
- `pnpm test:e2e`: ۵۹ pass / ۱ skip — روی ۳ viewport (شامل Navigation Contract + a11y)
- `pnpm build`: موفق — ۵۴ route + Serwist

## [0.3.0] — Phase 3: User Panel & Profile (2026-09-18)

### Added

- **User domain service** — `user.service.ts`: profile، sessions (device/os/browser/isCurrent)، notifications، security-events — isolation کامل از `userId` توکن
- **Users API** — `GET /users/me`، `PUT /users/profile`، `GET|DELETE /users/sessions` (+`[id]`)، `GET /users/notifications`، `POST /users/notifications/[id]/read`، `GET /users/security-events` — تحت `/api/v1/users/*`
- **PanelShell** — auth gate + sidebar دسکتاپ + bottom navigation موبایل (۷ آیتم) + user context
- **Dashboard** — welcome + وضعیت حساب + KYC preview + دارایی/تراکنش با برچسب «به‌زودی — پیش‌نمایش» + quick actions
- **Profile** — مشاهده + ویرایش واقعی نام/نام خانوادگی/ایمیل — mobile/kycLevel/status از این مسیر قابل تغییر نیستند
- **Security Center** — وضعیت امنیت (OTP/2FA readiness) + تغییر رمز عبور + ۵۰ رویداد امنیتی اخیر
- **Sessions** — device/browser/os/IP + برچسب «نشست جاری» + لغو تکی + خروج از سایر نشست‌ها (نشست جاری حفظ می‌شود)
- **Notifications/Referral/Support** — لیست اعلان‌ها + mark-as-read؛ کد دعوت + آمار preview؛ تیکت preview
- **`parseUserAgent`** — تجزیه سبک device/os/browser برای نمایش نشست‌ها
- **User fields** — `firstName`/`lastName`/`email`/`avatarUrl` + migration `add_user_profile_fields`
- **Tests** — ۱۳ unit (validator + UA parser) + ۱۰ integration (isolation/IDOR/idempotency) + ۴ E2E flow

### Changed

- `playwright.config.ts` — `dotenv/config` برای runner (DATABASE_URL در تست‌های service-level)
- تست E2E کاربر ایزوله per-test از service layer می‌سازد (rate limit در لایه route اعمال نمی‌شود)

### Fixed

- `markNotificationRead` idempotent شد (خواندن دوباره خطا نمی‌دهد؛ مالکیت ابتدا بررسی می‌شود)
- `parseUserAgent` — iPad/تبلت‌های Android درست تشخیص داده می‌شوند (بررسی tablet قبل از mobile)
- حذف `user-agent.h` (فایل C++ اشتباه) و `dashboard-client.tsx` (بدون ارجاع) و کامنت‌های غیرفارسی

### Security

- IDOR-safe: نشست/اعلان کاربر دیگر → 404 (نه 403 — وجود منبع فاش نمی‌شود)
- `profileUpdateSchema` فیلدهای حساس را strip می‌کند (mobile/kycLevel/status/referralCode)
- `PROFILE_UPDATE`، `SESSION_REVOKE*` در `audit_logs` ثبت می‌شوند
- `revokeOtherSessions` نشست جاری را با `keepSessionId` حفظ می‌کند

## [0.2.0] — Phase 2: Authentication & User Management (2026-09-18)

### Added

- **Auth Service کامل** — register، login، logout (idempotent)، refresh rotation، OTP send/verify، password forgot/reset/change، sessions list/revoke، `/me` — تحت `/api/v1/auth/*`
- **JWT دوگانه** — access token (۱۵ دقیقه، حاوی `sid`) + refresh token (۳۰ روز، rotation + reuse detection) — Web با httpOnly cookie، Mobile با Bearer
- **`sid` در access token** — revoke شدن Session بلافاصله روی همه APIها اثر می‌کند (بررسی نشست در `requireAuth`)
- **OTP امن** — هش با `OTP_PEPPER`، TTL ۱۲۰s، حداکثر ۵ تلاش، resend cooldown ۶۰s، replay resistant — plaintext در DB ذخیره نمی‌شود
- **Rate Limiting configurable** — از `RateLimitConfig` (seed: `api.general`، `otp.send`، `otp.verify`، `auth.login`، `auth.register`، `auth.password_reset`)
- **Brute force protection** — `failedLoginAttempts` + `lockedUntil` (۵ تلاش → قفل موقت) + پیام generic
- **RBAC foundation** — Role/Permission + `hasPermission` (SUPER_ADMIN همه‌کاره)
- **SMS Provider interface** — `MockSmsProvider` + `KavenegarProvider`؛ انتخاب با `SMS_PROVIDER` (نه NODE_ENV)
- **Dev endpoint** — `GET /api/v1/dev/otp/[mobile]` فقط با `DEV_OTP_ENDPOINT=true` + `SMS_PROVIDER=mock`
- **UI auth واقعی** — `/login`، `/register`، `/verify-otp` (auto-advance + paste + resend timer)، `/forgot-password`، `/reset-password`، `/dashboard` (پروفایل + نشست‌های فعال + لغو نشست + خروج)
- **Tests** — ۱۳ unit + ۹ integration (DB واقعی) + ۵ E2E flow روی ۳ viewport

### Changed

- Proxy به `/login` redirect می‌کند (نه `/auth/login`) + `callbackUrl` حفظ می‌شود + refresh cookie به‌عنوان نشانه نشست پذیرفته می‌شود
- Seed: `RateLimitConfig` keys با `FALLBACK_RULES` هماهنگ شد + test user با `mobileVerifiedAt` (self-healing upsert)
- `env.ts`: `JWT_ISSUER` + `JWT_AUDIENCE` اضافه شد
- Playwright: `globalSetup` شمارنده‌های rate limit را قبل از اجرا پاک می‌کند + timeout تست‌های چندمرحله‌ای bcrypt

### Fixed

- `pepper` از create data کاربر حذف شد (فیلد در schema نبود؛ pepper فقط در env می‌ماند)
- Seed idempotent شد (upsert برای wallet + asset accounts)
- Logout با refresh token نامعتبر/غایب — cookieها همچنان پاک می‌شوند (idempotent)
- Lint: `set-state-in-effect` در dashboard-client با الگوی cancelled flag رفع شد
- `getSessionMeta`/`env`/`useRouter` unused imports حذف شدند
- `AuditLog.entityType` required بود — fallback `'unknown'`

### Security

- OTP و Password هر دو با pepper جداگانه هش می‌شوند — pepper هرگز در DB نیست
- Refresh token فقط hash آن در DB است — reuse detection با revoke همه نشست‌ها
- User isolation: نشست کاربر دیگر قابل لیست/لغو نیست (تست integration)
- Dev OTP endpoint در production همیشه 404 (دو شرط env)
- هدر `SMS_PROVIDER=mock` در production build هشدار `error` لاگ می‌کند

### Validated

- `pnpm lint`: 0 errors / 0 warnings
- `pnpm typecheck`: 0 errors
- `pnpm test`: 50/50 (unit + integration روی PostgreSQL واقعی)
- `pnpm test:e2e`: 35 pass / 1 skip (mobile-only) — روی ۳ viewport
- `pnpm build`: موفق — ۳۵ route + Serwist SW

## [0.1.1] — Phase 0 Final Gate (2026-09-18)

### Changed

- MinIO image از `minio/minio:latest` (آرشیو شده در Docker Hub) به `quay.io/minio/minio:latest` تغییر کرد — برای Production باید Pin شود
- PostgreSQL volume از `/var/lib/postgresql/data` به `/var/lib/postgresql` اصلاح شد (الزام ساختار `pg_ctlcluster` در PostgreSQL 18+)
- MinIO healthcheck از `mc ready` به `curl /minio/health/live` تغییر کرد
- Node.js محلی به 24.21.0 LTS (Krypton) ارتقا یافت
- `seed.ts` به Prisma 7 Driver Adapter (`@prisma/adapter-pg`) مهاجرت کرد
- `tests/setup.ts` حذف شد (محیط تست node است، RTL استفاده نمی شود)

### Fixed

- **331 lint error رفع شد** — `src/generated/**` به eslint ignores اضافه شد (کد تولیدشده Prisma)
- Redis client: حذف `lazyConnect` — اتصال فعال با `enableOfflineQueue: false` (health check اکنون وضعیت واقعی را گزارش می دهد)
- Warning های lint پاک شدند (unused vars در seed, health route, proxy, redis)

### Validated (روی PostgreSQL 18.6 + Redis 7.4.11 واقعی)

- `docker compose up -d`: هر ۳ سرویس healthy (postgres / redis / minio)
- `pg_isready`: accepting connections — `redis-cli ping`: PONG — MinIO `/minio/health/live`: HTTP 200
- Prisma Generate + `migrate deploy` + `db seed`: موفق (۳۱ جدول، ۸۵ index، ۳۱ FK)
- `migrate status`: up to date — بدون drift
- ۵ تست integration جدید روی دیتابیس واقعی: تراز Debit/Credit، Rollback transaction، Idempotency unique، FK RESTRICT، fee split
- Health endpoint: `healthy` (database ok، redis ok)
- `pnpm lint`: 0 errors / 0 warnings — `pnpm typecheck`: pass — `pnpm test`: 16/16 — `pnpm build`: موفق

---

## [0.1.0-unreleased] — Phase 0 Status Revision (2026-09-18)

### Changed

- وضعیت Phase 0 از «تکمیل شده» به **CONDITIONALLY COMPLETE — ENVIRONMENT VALIDATION PENDING** اصلاح شد
- چک‌لیست رسمی Validation جدید: `docs/phases/PHASE-00-VALIDATION-CHECKLIST.md` (Environment / Infrastructure / Database / Application / Quality / PWA / Capacitor + Final Gate)
- Phase 1 تا عبور Phase 0 از Final Gate **BLOCKED** است
- PWA Spike موفق محسوب می‌شود، اما Android real device / iOS Safari / Installability / Push Notifications تا تست دستگاه واقعی **Pending** می‌مانند
- Mobile Runtime Validation برای فاز مربوطه (Phase 18) نگه داشته شد

### Corrected

- گزارش قبلی «ESLint pass (0 errors)» ثبت کرده بود که درست نبود: `pnpm lint` فعلاً **331 error** دارد (ریشه: `src/generated/prisma` در `eslint.config.mjs` → `ignores` نیست) — رفع در Final Gate
- Migration فقط به‌صورت SQL تولید شده؛ Validation نهایی باید روی PostgreSQL واقعی انجام شود (apply / drift / index / constraint / FK / rollback)

### Known Issues (اضافه)

- Node.js محلی v22 (الزام پروژه: 24 LTS)
- Docker نصب نیست — Infrastructure Validation کامل BLOCKED
- کل خروجی Phase 0 هنوز در Git commit نشده است

---

## [0.1.0] — Phase 0: Foundation (2026-09-18)

### Added

- Next.js 16.3.3 + TypeScript strict + Turbopack
- Tailwind CSS v4 + پالت navy/gold/cream + تم تیره
- فونت Vazirmatn + RTL + lang="fa"
- Prisma 7.10.0 + PostgreSQL 18 + Double-Entry Ledger schema (20+ models)
- Asset Accounts (Rial + Gold, extensible)
- IdempotencyRecord + RateLimitConfig tables
- Docker Compose (PostgreSQL 18 + Redis 7 + MinIO)
- Capacitor 8 (Android platform — دو Target: Web + Mobile)
- Serwist PWA (@serwist/turbopack) — service worker با 20 precache entries
- Application Foundation: env validation (Zod), Pino logger, RFC 7807 errors, API response envelope, proxy (middleware), health endpoint
- shadcn/ui foundation (button, input, card, badge, skeleton)
- TanStack Query + Zustand + Sonner
- Vitest (11 tests passing) + Playwright (آماده)
- ESLint 9 flat config + Prettier + Husky + lint-staged
- GitHub Actions CI pipeline
- .env.example + .nvmrc + .gitignore
- Documentation: ARCHITECTURE_DECISIONS, EXECUTION_STATUS, DATABASE, TESTING, SECURITY, DEPLOYMENT

### Changed

- middleware.ts → proxy.ts (Next.js 16 convention)
- Prisma client output → src/generated/prisma
- Prisma 7 Driver Adapter (@prisma/adapter-pg)

### Architecture Decisions

- ADR-001 تا ADR-014 در docs/ARCHITECTURE_DECISIONS.md
- 10 مورد PENDING BUSINESS DECISION

### Known Issues

- Docker نصب نیست در محیط development — docker-compose.yml آماده اما اجرا نشده
- Node.js محلی v22 — .nvmrc با 24 ساخته شد

## [0.2.0] — Phase 1 Landing & Public Website (2026-09-18)

### Added

- Landing Page کامل با ۱۵ بخش: Hero، Price Widget (Demo)، Features، WhyZar30، Stats، HowItWorks، GoldCalculator، Investment، Installment، Security، PhysicalGold، Referral، Testimonials، FAQ، CTA، DownloadApp
- Route group `(public)` با layout مشترک (Header، Footer، skip-link)
- صفحات عمومی: `/about`, `/security`, `/faq`, `/contact`, `/blog`, `/terms`, `/privacy`
- Route group `(auth)` با placeholder صفحات `/login` و `/register`
- Design System: `Container`, `Section` (+`titleAs` برای h1/h2)، `Logo`، `Accordion`، `Dialog`، `Tooltip` (Radix/shadcn)
- Price Service Interface (`src/lib/price/`) — Mock Provider فقط برای Development با `isLive: false` و `source: 'demo'` — جایگزینی Provider واقعی در Phase 5
- API route `/api/v1/price`
- SEO: `metadataBase`، `sitemap.xml`، `robots.txt`، `opengraph-image`، JSON-LD (Organization + WebSite + FAQPage)، canonical، یک h1 در هر صفحه
- PWA icons: تولید PNG از `public/icon.svg` با `scripts/generate-icons.mjs` (sharp)
- انیمیشن‌های float/fade-up + احترام کامل به `prefers-reduced-motion`
- Playwright: `playwright.config.ts` با ۳ پروژه (desktop-chrome / tablet / mobile-chrome) + ۷ تست E2E
- تست‌های unit جدید: landing-data، price-service، components (jsdom)

### Changed

- `CardTitle` به `h3` و `CardDescription` به `p` تغییر کرد (معناشناسی heading برای a11y/SEO)
- صفحه اصلی از `src/app/page.tsx` به `src/app/(public)/page.tsx` منتقل شد
- SVGهای پیش‌فرض create-next-app حذف شدند

### Fixed

- `opengraph-image` با متن فارسی در satori خطا می‌داد (lookupType 5) — متن لاتین استفاده شد
- پروژه tablet در Playwright به‌طور پیش‌فرض WebKit می‌خواست — به Chromium تغییر کرد

### Validated

- `pnpm lint`: 0 errors / 0 warnings
- `pnpm typecheck`: 0 errors
- `pnpm test`: 28/28 (unit + integration)
- `pnpm test:e2e`: 20 pass / 1 skip — روی ۳ viewport (desktop/tablet/mobile)
- `pnpm build`: موفق — ۲۰ route + Serwist service worker
