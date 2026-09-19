# Zar30 — Deployment Documentation

## Infrastructure V1 (ساده)

```
Internet
   │
   ▼
Reverse Proxy (Caddy)
   │
   ├── Next.js App (Web Target — SSR)
   │      └── /api/v1/*
   │
   ├── PostgreSQL 18.x
   ├── Redis 7.x
   └── MinIO (S3-compatible)
```

## Development

```bash
# پیش‌نیازها
node --version   # باید 24 باشد — nvm use 24
pnpm --version   # 9+
docker --version # برای DB/Redis

# راه‌اندازی
cp .env.example .env.local   # پر کردن متغیرها
docker compose up -d          # PostgreSQL + Redis + MinIO
pnpm install                  # نصب وابستگی‌ها
pnpm db:generate              # Prisma client
pnpm db:migrate               # Migration
pnpm db:seed                  # Seed (dev only)
pnpm dev                      # شروع dev server
```

## Build

```bash
# Web Target (SSR + PWA)
pnpm build

# Mobile Target (Capacitor static export)
BUILD_TARGET=mobile pnpm build
npx cap sync
```

## Docker Compose Services

| Service  | Image                      | Port       |
| -------- | -------------------------- | ---------- |
| postgres | postgres:18-alpine         | 5432       |
| redis    | redis:7-alpine             | 6379       |
| minio    | quay.io/minio/minio:latest | 9000, 9001 |

> **MinIO Image Note:** ایمیج `minio/minio` در Docker Hub آرشیو شده است. از رجیستری رسمی `quay.io/minio/minio` استفاده می کنیم. برای Development فعلاً `latest` قابل قبول است — برای Production باید نسخه Pin شود.
>
> **PostgreSQL 18+ Volume Note:** از نسخه ۱۸، ایمیج postgres داده را با ساختار `pg_ctlcluster` (زیرپوشه per-major-version) ذخیره می کند. Volume باید روی `/var/lib/postgresql` (نه `/var/lib/postgresql/data`) mount شود.

## CI/CD

- `.github/workflows/ci.yml`: Install → Typecheck → Lint → Test → Build
- Branch: `main`, `develop`

## Production (آینده)

- Docker + Reverse Proxy + PostgreSQL + Redis + MinIO
- Scaling به Swarm/K8s در صورت نیاز واقعی
