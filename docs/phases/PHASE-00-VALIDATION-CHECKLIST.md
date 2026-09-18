# Phase 0 — Validation Checklist

> وضعیت فعلی Phase 0: **✅ DONE — FINAL GATE PASSED**
>
> این چک‌لیست مرجع نهایی عبور Phase 0 از Final Gate بود و هم اکنون کامل اجرا شده است.
> آخرین اجرا: 2026-09-18 — Docker 29.8.0 / Compose v5.5.1 / Node 24.21.0 / PostgreSQL 18.6 / Redis 7.4.11

---

## ۱. Environment

| #     | مورد           | دستور بررسی              | معیار PASS         | نتیجه واقعی                                                                     | وضعیت   |
| ----- | -------------- | ------------------------ | ------------------ | ------------------------------------------------------------------------------- | ------- |
| ENV-1 | Node.js 24 LTS | `node -v`                | `v24.x`            | **v24.21.0 (Krypton LTS)** — نصب در `C:\Users\NADFER\nodejs24`                  | ✅ PASS |
| ENV-2 | pnpm           | `pnpm -v`                | pnpm 9+            | **12.4.2**                                                                      | ✅ PASS |
| ENV-3 | Docker         | `docker --version`       | نصب و اجرای daemon | **Docker 29.8.0** (Docker Desktop، مسیر `AppData\Local\Programs\DockerDesktop`) | ✅ PASS |
| ENV-4 | Docker Compose | `docker compose version` | نصب v2             | **v5.5.1**                                                                      | ✅ PASS |

---

## ۲. Infrastructure

| #       | مورد          | دستور بررسی                                | معیار PASS                        | نتیجه واقعی                                                                | وضعیت   |
| ------- | ------------- | ------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------- | ------- |
| INFRA-1 | PostgreSQL 18 | `docker compose up -d` سپس `docker ps`     | container سالم + healthcheck pass | **PostgreSQL 18.6** — `Up (healthy)` — `pg_isready: accepting connections` | ✅ PASS |
| INFRA-2 | Redis 7       | `docker exec zarnama-redis redis-cli ping` | پاسخ `PONG`                       | **Redis 7.4.11** — `PONG`                                                  | ✅ PASS |
| INFRA-3 | MinIO         | `curl localhost:9000/minio/health/live`    | HTTP 200                          | **HTTP 200** — `Up (healthy)` روی `quay.io/minio/minio:latest`             | ✅ PASS |

نتایج دستورات الزامی:

```text
node -v                 → v24.21.0
pnpm -v                 → 12.4.2
docker --version        → Docker version 29.8.0, build 88096ef
docker compose version  → Docker Compose version v5.5.1

docker compose up -d    → 3 containers started (postgres / redis / minio)
docker ps               → all 3 Up (healthy)
```

---

## ۳. Database

| #     | مورد                                  | روش بررسی                                      | معیار PASS                 | نتیجه واقعی                                                                                         | وضعیت   |
| ----- | ------------------------------------- | ---------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| DB-1  | Prisma 7 + Driver Adapter             | `pnpm prisma generate` با `@prisma/adapter-pg` | بدون error                 | ✅ Generated v7.10.0                                                                                | ✅ PASS |
| DB-2  | Prisma Generate روی نسخه نهایی        | generate پس از Node 24                         | بدون error                 | ✅ روی Node 24.21.0                                                                                 | ✅ PASS |
| DB-3  | Prisma Migration روی PostgreSQL واقعی | `prisma migrate deploy`                        | migration واقعاً apply شود | ✅ `20251218000000_init` applied                                                                    | ✅ PASS |
| DB-4  | Real PostgreSQL Connection            | query ساده                                     | query موفق                 | ✅ `SELECT version()` → PostgreSQL 18.6                                                             | ✅ PASS |
| DB-5  | Schema Drift Check                    | `prisma migrate status`                        | up to date                 | ✅ `Database schema is up to date!`                                                                 | ✅ PASS |
| DB-6  | Double-Entry Tables                   | بررسی `\dt`                                    | همه موجود                  | ✅ ۳۱ جدول شامل `ledger_accounts`, `journal_entries`, `ledger_entries`, `asset_accounts`, `wallets` | ✅ PASS |
| DB-7  | Indexها                               | `pg_indexes`                                   | indexها موجود              | ✅ ۸۵ index (۴۴ unique)                                                                             | ✅ PASS |
| DB-8  | Constraints + FK                      | `information_schema`                           | FKها و constraintها موجود  | ✅ ۳۱ FK + ۲۱۲ CHECK — `ledger_entries` FK با `ON DELETE RESTRICT`                                  | ✅ PASS |
| DB-9  | Transaction Rollback                  | integration test با خطای عمدی                  | rollback کامل              | ✅ هیچ رکورد نیمه‌کاره باقی نماند                                                                   | ✅ PASS |
| DB-10 | Database Integration Test             | `tests/integration/ledger.test.ts`             | تست pass                   | ✅ ۵/۵ (balance, rollback, idempotency, FK RESTRICT, fee split)                                     | ✅ PASS |
| DB-11 | Seed روی DB واقعی                     | `prisma db seed`                               | داده‌ها ثبت شوند           | ✅ ۱۳ Ledger Account + ۵ RateLimit + ۷ FeatureFlag + Plans + Test User                              | ✅ PASS |

---

## ۴. Application

| #     | مورد                    | روش بررسی                                  | معیار PASS                   | نتیجه واقعی                          | وضعیت   |
| ----- | ----------------------- | ------------------------------------------ | ---------------------------- | ------------------------------------ | ------- |
| APP-1 | Health Endpoint Healthy | `GET /api/v1/health` با سرویس‌های روشن     | HTTP 200 + `status: healthy` | ✅ `healthy` — db: 113ms, redis: 2ms | ✅ PASS |
| APP-2 | Database Connectivity   | `checks.database`                          | `status: ok`                 | ✅ `ok`                              | ✅ PASS |
| APP-3 | Redis Connectivity      | `checks.redis`                             | `status: ok`                 | ✅ `ok` (بعد از رفع lazyConnect)     | ✅ PASS |
| APP-4 | API Foundation          | envelope + RFC 7807 + headers + request ID | مطابق Phase 0                | ✅                                   | ✅ PASS |

---

## ۵. Quality

| #   | مورد                     | دستور            | معیار PASS      | نتیجه واقعی                                                                                               | وضعیت   |
| --- | ------------------------ | ---------------- | --------------- | --------------------------------------------------------------------------------------------------------- | ------- |
| Q-1 | Typecheck                | `pnpm typecheck` | 0 error         | ✅ 0 error                                                                                                | ✅ PASS |
| Q-2 | Lint                     | `pnpm lint`      | 0 error         | ✅ **0 errors / 0 warnings** (331 error رفع شد: `src/generated/**` → eslint ignores + پاک‌سازی warningها) | ✅ PASS |
| Q-3 | Unit + Integration Tests | `pnpm test`      | همه pass        | ✅ **16/16** (11 unit + 5 integration روی DB واقعی)                                                       | ✅ PASS |
| Q-4 | Production Build         | `pnpm build`     | build موفق + SW | ✅ Turbopack — Serwist 20 precache entries                                                                | ✅ PASS |

---

## ۶. PWA Status

| #     | مورد                                     | نتیجه                                     | وضعیت                                                       |
| ----- | ---------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| PWA-1 | Production build با `@serwist/turbopack` | موفق — 20 precache entries                | ✅ PASS                                                     |
| PWA-2 | SW generation در `/serwist/sw.js`        | موفق                                      | ✅ PASS                                                     |
| PWA-3 | Financial API blocklist (NetworkOnly)    | پیاده‌سازی شده                            | ✅ PASS (ساختاری)                                           |
| PWA-4 | Android real device (Chrome)             | —                                         | ⏳ PENDING — نیازمند دستگاه فیزیکی (غیر مسدودکننده Phase 0) |
| PWA-5 | iOS Safari                               | —                                         | ⏳ PENDING — نیازمند دستگاه فیزیکی (غیر مسدودکننده Phase 0) |
| PWA-6 | Installability                           | —                                         | ⏳ PENDING — همراه PWA-4/5                                  |
| PWA-7 | Push Notifications                       | —                                         | ⏳ PENDING (نیاز به VAPID keys — Phase مربوطه)              |
| PWA-8 | Update behavior / cache invalidation     | skipWaiting + clientsClaim + NetworkFirst | ✅ PASS (ساختاری)                                           |

**جمع‌بندی PWA Spike:** موفق — تست‌های دستگاه واقعی (PWA-4 تا PWA-7) به‌عنوان Deferred Pending ثبت می‌شوند و بخشی از الزامات عبور Phase 0 نیستند (طبق دستور «تا حد امکان»).

---

## ۷. Capacitor Status

| #     | مورد                                       | وضعیت                       |
| ----- | ------------------------------------------ | --------------------------- |
| CAP-1 | Capacitor init + Android platform          | ✅ DONE (Foundation)        |
| CAP-2 | دو Target (Web SSR + Mobile static export) | ✅ DONE (پیکربندی)          |
| CAP-3 | Secure storage abstraction                 | ✅ DONE (پیکربندی)          |
| CAP-4 | Mobile Runtime Validation                  | ⏳ به Phase 18 موکول می‌شود |

---

## ۸. Phase 0 Final Gate — اجرا شده ✅

| مرحله                           | نتیجه                                 |
| ------------------------------- | ------------------------------------- |
| ۱. Docker services بالا         | ✅ ۳/۳ healthy                        |
| ۲. Migration واقعی + بدون drift | ✅ applied + up to date               |
| ۳. Prisma validate              | ✅ DB-1 تا DB-8                       |
| ۴. Redis validate               | ✅ PONG + health ok                   |
| ۵. Health endpoint Healthy      | ✅ `healthy`                          |
| ۶. Test Suite                   | ✅ 16/16                              |
| ۷. Typecheck                    | ✅ 0 error                            |
| ۸. Lint صفر error               | ✅ 0/0                                |
| ۹. Production Build             | ✅ موفق                               |
| ۱۰. Acceptance Matrix           | ✅ در `EXECUTION_STATUS.md` به‌روز شد |

### قاعده تصمیم نهایی

- ✅ همه موارد الزامی PASS → **`Phase 0 = DONE`**
- موارد Deferred (غیر الزامی): PWA-4 تا PWA-7 (دستگاه فیزیکی)، CAP-4 (Phase 18)، MinIO pin (Production)

---

## ۹. Remaining Items (غیر مسدودکننده)

| مورد                                                                | وضعیت                            |
| ------------------------------------------------------------------- | -------------------------------- |
| PWA تست دستگاه واقعی (Android Chrome / iOS Safari / Install / Push) | Deferred — نیازمند دستگاه فیزیکی |
| Mobile Runtime Validation (APK build)                               | Phase 18                         |
| MinIO image pinning برای Production                                 | قبل از deploy                    |
| Business Decisions (Spread, Fees, Limits…)                          | PENDING BUSINESS DECISION        |

---

> آخرین به‌روزرسانی: 2026-09-18 — **Final Gate PASSED**
