# Zarnama — Testing Documentation

## Test Stack

- **Unit/Integration:** Vitest 3.2.4
- **E2E:** Playwright 1.54.2 (آماده — هنوز تست E2E نوشته نشده)
- **Coverage:** @vitest/coverage-v8

## دستورها

```bash
pnpm test          # اجرای unit tests
pnpm test:watch    # watch mode
pnpm test:e2e      # Playwright (آینده)
pnpm typecheck     # TypeScript check
pnpm lint          # ESLint
pnpm format:check  # Prettier check
```

## ساختار

```
tests/
  unit/           # تست‌های واحد
  integration/    # تست‌های یکپارچگی
  e2e/            # تست‌های E2E (آینده)
  setup.ts        # تنظیمات Vitest
```

## تست‌های فعلی (Phase 0)

| فایل                            | تست‌ها | وضعیت |
| ------------------------------- | ------ | ----- |
| `tests/unit/env.test.ts`        | 1      | ✅    |
| `tests/unit/validators.test.ts` | 3      | ✅    |
| `tests/unit/utils.test.ts`      | 4      | ✅    |
| `tests/unit/api-error.test.ts`  | 3      | ✅    |

**مجموع:** ۱۱ تست — همه pass

## Database Connectivity Test

- Health endpoint در `GET /api/v1/health` — وضعیت DB و Redis را گزارش می‌دهد
- در Phase بعدی: integration tests با test database

## CI Pipeline

`.github/workflows/ci.yml`: Install → Typecheck → Lint → Test → Build
