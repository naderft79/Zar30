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
