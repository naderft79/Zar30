# Zarnama — Execution Status

> وضعیت اجرای پروژه — به‌روزرسانی شده در Phase 0

## Phase 0: Setup & Infrastructure + PWA Spike

**وضعیت:** ✅ تکمیل شده (با محدودیت‌های محیطی)

### تسک‌ها

| #    | تسک                                     | وضعیت | توضیح                                                                                                                                    |
| ---- | --------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1  | Node.js 24 LTS + pin                    | ✅    | `.nvmrc` = `24`, `engines` در package.json                                                                                               |
| 0.2  | Next.js 16.3.3 + Turbopack              | ✅    | پروژه ساخته شد — build با Turbopack موفق                                                                                                 |
| 0.3  | وابستگی‌ها                              | ✅    | Prisma 7.10.0, ioredis, bullmq, socket.io, zod, jose, bcryptjs, zustand, tanstack-query, recharts, sonner, lucide, react-hook-form, pino |
| 0.4  | ESLint + Prettier + Husky + lint-staged | ✅    | eslint.config.mjs (flat config), .prettierrc.json, .husky/pre-commit                                                                     |
| 0.5  | ساختار پوشه‌ها                          | ✅    | طبق MEGAPLAN بخش ۳۰                                                                                                                      |
| 0.6  | Tailwind v4 + پالت navy/gold/cream      | ✅    | Design tokens در globals.css + تم تیره                                                                                                   |
| 0.7  | Vazirmatn + RTL                         | ✅    | next/font + dir="rtl" + lang="fa"                                                                                                        |
| 0.8  | Prisma 7 + schema پایه                  | ✅    | Double-Entry Ledger + Asset Accounts + Idempotency + RateLimitConfig + ۲۰ مدل                                                            |
| 0.9  | docker-compose                          | ✅    | PostgreSQL 18 + Redis 7 + MinIO (Docker نصب نیست — فایل آماده)                                                                           |
| 0.10 | Capacitor init                          | ✅    | Android platform اضافه شد — دو Target (Web + Mobile)                                                                                     |
| 0.11 | PWA Spike                               | ✅    | @serwist/turbopack — production build موفق — 20 precache entries                                                                         |
| 0.12 | .env.example + README + docs            | ✅    | .env.example + docs/ فایل‌ها                                                                                                             |

### Acceptance Criteria

| معیار                            | وضعیت                        |
| -------------------------------- | ---------------------------- |
| `pnpm dev` با Turbopack اجرا شود | ✅                           |
| `pnpm lint` pass                 | ✅ (0 errors, 8 warnings)    |
| `pnpm typecheck` pass            | ✅                           |
| `pnpm test` pass                 | ✅ (11 tests)                |
| `pnpm build` موفق                | ✅ (Turbopack + Serwist)     |
| ساختار پوشه‌ها مطابق MEGAPLAN    | ✅                           |
| پالت رنگی + فونت Vazirmatn + RTL | ✅                           |
| Prisma 7 schema پایه + generate  | ✅                           |
| `.nvmrc` با `24`                 | ✅                           |
| PWA Spike نتایج ثبت شده          | ✅ (در ADR-009)              |
| docker compose بالا بیاید        | ⚠️ BLOCKED (Docker نصب نیست) |
| `npx cap` کار کند                | ✅                           |

### مشکلات پیدا شده

1. **Docker نصب نیست** — فایل docker-compose.yml آماده است اما اجرا نیاز به نصب Docker دارد
2. **Node.js محلی v22 است** — `.nvmrc` با `24` ساخته شد، در CI از Node 24 استفاده می‌شود
3. **Prisma 7 Driver Adapter** — نیاز به `@prisma/adapter-pg` بود (در Prisma 6 مستقیم بود)
4. **middleware → proxy** — Next.js 16 convention تغییر کرده
5. **@serwist/next با Turbopack ناسازگار** — به `@serwist/turbopack` مهاجرت شد

### تصمیم‌های جدید

- استفاده از `@serwist/turbopack` به جای `@serwist/next` (سازگاری Turbopack)
- Prisma client در `src/generated/prisma` (به جای `node_modules/.prisma`)
- proxy.ts به جای middleware.ts (Next.js 16 convention)

## Phase بعدی

**Phase 1:** Landing Page — در انتظار تأیید Phase 0
