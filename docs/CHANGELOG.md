# Zarnama — Changelog

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
