# Zarnama — Changelog

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
