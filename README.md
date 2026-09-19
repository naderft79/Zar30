# زرسی (Zar30)

پلتفرم خرید، فروش و سرمایه‌گذاری طلای آب‌شده ۱۸ عیار

## Stack

- **Framework:** Next.js 16.3.3 + TypeScript + Turbopack
- **Database:** PostgreSQL 18.x + Prisma 7.10.0
- **Cache/Queue:** Redis 7.x + BullMQ
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State:** Zustand + TanStack Query
- **Mobile:** Capacitor 8 (Android + iOS)
- **PWA:** Serwist (@serwist/turbopack)
- **Testing:** Vitest + Playwright
- **Package Manager:** pnpm

## شروع

```bash
# پیش‌نیازها
node --version   # 24 LTS — nvm use 24
pnpm --version

# راه‌اندازی
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## دستورها

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm test         # unit tests
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm db:migrate   # Prisma migration
pnpm db:seed      # seed database
```

## ساختار

```
src/
  app/            # Next.js App Router
    api/v1/       # REST API endpoints
    dashboard/    # پنل کاربری
    admin/        # پنل ادمین
    serwist/      # Service Worker route
  components/     # React components
  lib/            # Business logic
    db/           # Prisma client
    redis/        # Redis client
    services/     # Domain services
    validators/   # Zod schemas
  hooks/          # React hooks
  stores/         # Zustand stores
  types/          # Shared types
  sw.ts           # Service Worker source
prisma/
  schema.prisma   # Database schema
  migrations/     # Migration files
  seed.ts         # Seed script
tests/            # Test files
docs/             # Documentation
```

## مستندات

- [Architecture Decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Execution Status](docs/EXECUTION_STATUS.md)
- [Database](docs/DATABASE.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Phase 0 Report](docs/phases/PHASE-00-REPORT.md)
- [Changelog](docs/CHANGELOG.md)

## معماری

- **Double-Entry Ledger** — هر تراکنش balanced (debit = credit)
- **Asset Accounts** — جدا برای Rial + Gold (قابل توسعه)
- **PostgreSQL** — مرجع نهایی Financial Integrity
- **Redis** — cache/queue/coordination (نه مرجع مالی)
- **Idempotency** — durable در DB + Redis acceleration
- **دو Target** — Web (SSR) + Mobile (Capacitor)
- **Offline ممنوع** — عملیات مالی فقط آنلاین
