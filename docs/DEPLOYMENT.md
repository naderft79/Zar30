# Zarnama — Deployment Documentation

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

| Service  | Image              | Port       |
| -------- | ------------------ | ---------- |
| postgres | postgres:18-alpine | 5432       |
| redis    | redis:7-alpine     | 6379       |
| minio    | minio/minio:latest | 9000, 9001 |

## CI/CD

- `.github/workflows/ci.yml`: Install → Typecheck → Lint → Test → Build
- Branch: `main`, `develop`

## Production (آینده)

- Docker + Reverse Proxy + PostgreSQL + Redis + MinIO
- Scaling به Swarm/K8s در صورت نیاز واقعی
