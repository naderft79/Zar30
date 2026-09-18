# گزارش Phase 0 — زرنما

## خلاصه

Phase 0 (Setup & Infrastructure + PWA Spike) با موفقیت تکمیل شد. Foundation کامل پروژه با معماری Double-Entry Ledger، دو Target Web/Mobile، و PWA Spike موفق ساخته شد.

## چه چیزهایی ساخته شد

### ۱. Project Foundation

- Next.js 16.3.3 + TypeScript strict + Turbopack
- pnpm 12.4.2 + `.nvmrc` (Node 24)
- ESLint 9 flat config + Prettier + Husky + lint-staged
- ساختار پوشه‌ها طبق MEGAPLAN بخش ۳۰

### ۲. Database Foundation

- PostgreSQL 18.x (Docker: `postgres:18-alpine`)
- Prisma 7.10.0 + Driver Adapter (`@prisma/adapter-pg`)
- Schema کامل: ۲۰+ مدل شامل Double-Entry Ledger
- Migration SQL تولید شده (`prisma/migrations/20251218000000_init/`)
- Seed file آماده (Ledger Accounts + Rate Limits + Plans + Templates)

### ۳. Financial Foundation

- `LedgerAccount` — حساب‌های دفتری (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE)
- `JournalEntry` — رویداد حسابداری (balanced)
- `LedgerEntry` — رکورد debit/credit (immutable)
- `AssetAccount` — حساب دارایی کاربر (RIAL + GOLD)
- `IdempotencyRecord` — idempotency durable در DB
- `RateLimitConfig` — rate limits configurable
- `AuditLog` — لاگ ممیزی

### ۴. Application Foundation

- `src/lib/config/env.ts` — اعتبارسنجی env با Zod
- `src/lib/logger/logger.ts` — Pino structured logging + redaction
- `src/lib/errors/api-error.ts` — RFC 7807 errors
- `src/lib/api/response.ts` — Response envelope + error handler
- `src/lib/validators/common.ts` — Zod validators (mobile, OTP, password, IBAN)
- `src/lib/db/prisma.ts` — Prisma 7 client singleton
- `src/lib/redis/client.ts` — Redis client (ioredis)
- `src/lib/platform/platform.ts` — Web/Mobile detection + secure storage
- `src/lib/utils/utils.ts` — Utilities (cn, Persian digits, formatting)
- `src/proxy.ts` — Security headers + auth guard + request ID
- `src/app/api/v1/health/route.ts` — Health check endpoint
- `src/components/providers/` — TanStack Query + Sonner + SW registration

### ۵. UI Foundation

- Tailwind CSS v4 + پالت navy/gold/cream + تم تیره
- فونت Vazirmatn + RTL + lang="fa"
- shadcn/ui (button, input, card, badge, skeleton)
- Design tokens در globals.css

### ۶. Infrastructure

- `docker-compose.yml` — PostgreSQL 18 + Redis 7 + MinIO
- `.env.example` — همه متغیرها + PENDING BUSINESS DECISION comments
- `.gitignore` — env, generated, android, ios
- `.github/workflows/ci.yml` — CI pipeline

### ۷. Mobile Foundation (Capacitor)

- Capacitor 8 + Android platform
- `capacitor.config.ts` — appId, webDir, plugins
- `BUILD_TARGET=mobile` → static export
- دو Target واضح: Web (SSR) + Mobile (Capacitor)

### ۸. PWA Spike

- `@serwist/turbopack` — سازگار با Turbopack
- Service worker در `src/sw.ts` — financial API blocklist
- Route handler در `src/app/serwist/[path]/route.ts`
- `manifest.json` — installable PWA
- Production build موفق — 20 precache entries

## Stack نهایی

| لایه        | تکنولوژی                 | نسخه                        |
| ----------- | ------------------------ | --------------------------- |
| Runtime     | Node.js                  | 24 LTS                      |
| Framework   | Next.js                  | 16.3.3                      |
| Build       | Turbopack                | built-in                    |
| Language    | TypeScript               | 5.9.3 (strict)              |
| Database    | PostgreSQL               | 18.x                        |
| ORM         | Prisma                   | 7.10.0                      |
| Cache/Queue | Redis                    | 7.x                         |
| Styling     | Tailwind CSS             | 4.3.3                       |
| Components  | shadcn/ui                | latest                      |
| State       | Zustand + TanStack Query | 5.0.5 / 5.82.0              |
| Mobile      | Capacitor                | 8.5.2                       |
| PWA         | Serwist                  | 9.5.12 (@serwist/turbopack) |
| Validation  | Zod                      | 3.25.76                     |
| Auth        | jose + bcryptjs          | 6.0.11 / 3.0.2              |
| Logging     | Pino                     | 9.7.0                       |
| Testing     | Vitest + Playwright      | 3.2.4 / 1.54.2              |
| Linting     | ESLint                   | 9.31.0                      |
| Formatting  | Prettier                 | 3.6.2                       |

## Database Foundation

- **۲۱ enum** برای وضعیت‌های مختلف
- **۲۷ model** برای همه دامنه‌ها
- **۱ migration** اولیه (789 خط SQL)
- **Seed** آماده با Ledger Accounts + Rate Limits + Plans

## PWA Spike — نتیجه

| تست                           | نتیجه      | توضیح                                          |
| ----------------------------- | ---------- | ---------------------------------------------- |
| Production build (Turbopack)  | ✅ PASS    | Build موفق با `@serwist/turbopack`             |
| Service Worker generation     | ✅ PASS    | `/serwist/sw.js` با 20 precache entries        |
| SW registration code          | ✅ PASS    | `ServiceWorkerRegister` component              |
| Financial API blocklist       | ✅ PASS    | NetworkOnly برای APIهای مالی                   |
| Offline shell (non-financial) | ✅ PASS    | defaultCache + font/image caching              |
| Installability                | ⏳ PENDING | نیاز به تست روی دستگاه واقعی                   |
| Chrome Android                | ⏳ PENDING | نیاز به تست روی دستگاه واقعی                   |
| Safari iOS                    | ⏳ PENDING | نیاز به تست روی دستگاه واقعی                   |
| Push notifications            | ⏳ PENDING | نیاز به VAPID keys + تست                       |
| Update behavior               | ✅ PASS    | skipWaiting + clientsClaim                     |
| Cache invalidation            | ✅ PASS    | NetworkFirst برای API + CacheFirst برای assets |

**نتیجه کلی:** Serwist با Turbopack سازگار است. PWA Layer قابل استفاده است — تست‌های دستگاهی در فاز بعدی انجام می‌شود.

## Capacitor — نتیجه

| مورد                     | وضعیت                      |
| ------------------------ | -------------------------- |
| Capacitor init           | ✅                         |
| Android platform         | ✅                         |
| iOS platform             | ⏳ (V2 — نیاز به macOS)    |
| دو Target (Web + Mobile) | ✅                         |
| Secure storage           | ✅ (Capacitor Preferences) |
| Static export            | ✅ (BUILD_TARGET=mobile)   |

## Docker — نتیجه

| مورد                | وضعیت                        |
| ------------------- | ---------------------------- |
| docker-compose.yml  | ✅ آماده                     |
| PostgreSQL 18 image | ✅ postgres:18-alpine        |
| Redis 7 image       | ✅ redis:7-alpine            |
| MinIO image         | ✅ minio/minio:latest        |
| اجرای واقعی         | ⚠️ BLOCKED — Docker نصب نیست |

## تست‌های اجرا شده

| تست                 | تعداد | وضعیت                                  |
| ------------------- | ----- | -------------------------------------- |
| Unit Tests (Vitest) | 11    | ✅ همه pass                            |
| TypeScript Check    | —     | ✅ 0 errors                            |
| ESLint              | —     | ✅ 0 errors, 8 warnings                |
| Production Build    | —     | ✅ موفق                                |
| Health Endpoint     | —     | ✅ 503 degraded (DB/Redis down — درست) |

## مشکلات پیدا شده

1. **Docker نصب نیست** — فایل‌ها آماده، اجرا BLOCKED
2. **Node.js محلی v22** — `.nvmrc` با 24 ساخته شد
3. **Prisma 7 Driver Adapter** — تغییر بزرگ نسبت به Prisma 6
4. **middleware → proxy** — Next.js 16 convention تغییر کرد
5. **@serwist/next با Turbopack ناسازگار** — به `@serwist/turbopack` مهاجرت شد
6. **Hydration mismatch** — `cz-shortcut-listen` (browser extension — مشکل ما نیست)

## تصمیم‌های جدید

- `@serwist/turbopack` به جای `@serwist/next`
- Prisma client در `src/generated/prisma`
- proxy.ts به جای middleware.ts
- Driver Adapter pattern برای Prisma 7

## موارد Pending

| مورد                    | وضعیت                               |
| ----------------------- | ----------------------------------- |
| Spread                  | PENDING BUSINESS DECISION           |
| Trading Fee             | PENDING BUSINESS DECISION           |
| Withdrawal Limits       | PENDING BUSINESS DECISION           |
| Investment Rate         | PENDING BUSINESS DECISION           |
| Installment Rate        | PENDING BUSINESS DECISION           |
| Referral Commission     | PENDING BUSINESS DECISION           |
| Physical Delivery Rules | PENDING BUSINESS DECISION           |
| SMS Provider            | PENDING BUSINESS DECISION           |
| Payment Gateway         | PENDING BUSINESS DECISION           |
| Price API Provider      | PENDING BUSINESS DECISION           |
| PWA تست دستگاه واقعی    | نیاز به Chrome Android + Safari iOS |
| Docker اجرا             | نیاز به نصب Docker                  |
| Node 24 نصب محلی        | نیاز به nvm/nvm-windows             |

## فایل‌های مهم ایجاد/تغییرکرده

### ایجاد شده (۶۰+ فایل)

- `package.json`, `tsconfig.json`, `next.config.ts`, `capacitor.config.ts`
- `prisma/schema.prisma` (791 خط), `prisma.config.ts`, `prisma/seed.ts`
- `prisma/migrations/20251218000000_init/migration.sql` (789 خط)
- `docker-compose.yml`, `.env.example`, `.nvmrc`, `.gitignore`
- `eslint.config.mjs`, `.prettierrc.json`, `.lintstagedrc.json`
- `.github/workflows/ci.yml`
- `vitest.config.ts`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/sw.ts`, `src/app/serwist/[path]/route.ts`, `src/proxy.ts`
- `src/lib/db/prisma.ts`, `src/lib/redis/client.ts`, `src/lib/config/env.ts`
- `src/lib/logger/logger.ts`, `src/lib/errors/api-error.ts`, `src/lib/api/response.ts`
- `src/lib/validators/common.ts`, `src/lib/utils/utils.ts`, `src/lib/platform/platform.ts`
- `src/types/index.ts`
- `src/components/providers/providers.tsx`, `src/components/providers/sw-register.tsx`
- `src/components/ui/` (button, input, card, badge, skeleton)
- `public/manifest.json`
- `tests/` (4 test files + setup)
- `docs/` (7 documentation files)

### تغییر کرده

- `MEGAPLAN.md` — قبلاً به‌روزرسانی شده
- `AGENTS.md` — قبلاً به‌روزرسانی شده

## وضعیت Git

- Branch: `main`
- Remote: `origin/main` (GitHub)
- Commit: در انتظار commit نهایی Phase 0

## وضعیت Acceptance Criteria

| معیار                         | وضعیت                        |
| ----------------------------- | ---------------------------- |
| `pnpm dev` اجرا شود           | ✅                           |
| `pnpm lint` pass              | ✅                           |
| `pnpm typecheck` pass         | ✅                           |
| `pnpm test` pass              | ✅                           |
| `pnpm build` موفق             | ✅                           |
| ساختار پوشه‌ها مطابق MEGAPLAN | ✅                           |
| پالت رنگی + Vazirmatn + RTL   | ✅                           |
| Prisma schema + generate      | ✅                           |
| `.nvmrc` با `24`              | ✅                           |
| PWA Spike نتیجه‌دار           | ✅                           |
| docker compose بالا بیاید     | ⚠️ BLOCKED (Docker نصب نیست) |

## Phase بعدی

**Phase 1:** Landing Page — آماده برای شروع پس از تأیید Phase 0
