# Zar30 — Deployment Documentation

## Production Architecture (Native VPS — بدون Docker)

```
Internet
   │
   ▼
Nginx / aaPanel (:443 — SSL)
   │ proxy → 127.0.0.1:3000
   ▼
Next.js (PM2 → Node 24 — SSR)
   │      └── /api/v1/*
   ├── PostgreSQL (native, 127.0.0.1:5432)
   ├── Redis (native, 127.0.0.1:6379)
   └── Object Storage (S3-compatible — ENV-driven)
```

**Production به Docker نیاز ندارد.** راهنمای کامل:
`docs/deployment/AA_PANEL.md` و `docs/deployment/PRODUCTION.md`
کانفیگ نمونه‌ی Nginx: `deploy/nginx/zar30.conf`

## Development

```bash
# پیش‌نیازها
node --version   # باید 24 باشد — nvm use 24
pnpm --version   # 12+

# راه‌اندازی
cp .env.example .env    # پر کردن متغیرها (NODE_ENV=development برای dev)
pnpm install            # نصب وابستگی‌ها
pnpm db:generate        # Prisma client
pnpm db:migrate         # Migration (فقط dev)
pnpm db:seed            # Seed (dev only)
pnpm dev                # شروع dev server روی پورت 3000
```

### سرویس‌های dev (PostgreSQL / Redis / MinIO)

`docker-compose.yml` **فقط برای توسعه محلی** است و نقشی در production ندارد.
اگر Postgres/Redis را native نصب کرده‌اید، به آن نیازی نیست:

```bash
docker compose up -d    # Postgres:5432 + Redis:6379 + MinIO:9000 (dev only)
```

| Service  | Image                      | Port       |
| -------- | -------------------------- | ---------- |
| postgres | postgres:18-alpine         | 5432       |
| redis    | redis:7-alpine             | 6379       |
| minio    | quay.io/minio/minio:latest | 9000, 9001 |

## Build

```bash
# Web Target (SSR + PWA)
pnpm build

# Mobile Target (Capacitor static export)
BUILD_TARGET=mobile pnpm build
npx cap sync
```

## Production Quick Reference

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy                      # هرگز migrate dev روی production نه
pnpm build
pm2 start ecosystem.config.cjs --env production
pm2 save && pm2 startup
```

## CI/CD

- `.github/workflows/ci.yml`: Install → Typecheck → Lint → Test → Build
- GitHub service containers (postgres/redis) فقط برای CI هستند — به deployment مربوط نیستند
- Branch: `main`, `develop`
