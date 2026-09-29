# Zar30 — Production Deployment (Native VPS, بدون Docker)

Zar30 در production **بدون Docker** روی VPS اجرا می‌شود.
Stack: Node 24 + pnpm + PM2 + PostgreSQL + Redis + Nginx (aaPanel).

راهنمای کامل نصب: [AA_PANEL.md](./AA_PANEL.md)
کانفیگ نمونه‌ی Nginx: `deploy/nginx/zar30.conf`

## دستورهای کلیدی

```bash
pnpm install --frozen-lockfile
pnpm db:generate      # prisma generate
pnpm db:deploy        # prisma migrate deploy
pnpm build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## اصول production

| بخش             | تنظیم                                                     |
| --------------- | --------------------------------------------------------- |
| App             | `next start` روی `127.0.0.1:3000` توسط PM2                |
| Public entry    | فقط Nginx روی 443 — پورت 3000 از اینترنت بسته             |
| Database        | PostgreSQL native روی `127.0.0.1:5432` — `DATABASE_URL`   |
| Redis           | native روی `127.0.0.1:6379` — `REDIS_URL`                 |
| Storage         | S3-compatible توسط `S3_*` env — MinIO محلی یا سرویس خارجی |
| SSL             | aaPanel / Let's Encrypt — termination در Nginx            |
| Financial truth | PostgreSQL — Redis هرگز source of truth مالی نیست         |

## قوانین ممنوعه در production

- `prisma migrate dev` / `db:push` ممنوع — فقط `pnpm db:deploy`
- `SMS_PROVIDER=mock` ممنوع — باید `kavenegar` باشد
- `DEV_OTP_ENDPOINT=true` ممنوع
- `LOG_PRETTY=true` ممنوع
- پورت‌های 3000/5432/6379/9000 public ممنوع
- هیچ secret واقعی در repo ممنوع — فقط `.env` روی سرور

## Update workflow

۱. `pg_dump` backup → ۲. `git pull` → ۳. `pnpm install --frozen-lockfile` →
۴. `pnpm db:generate` → ۵. `pnpm db:deploy` → ۶. `pnpm build` → ۷. `pm2 restart zar30`

جزئیات کامل در AA_PANEL.md بخش ۱۳ و ۱۴.

## Health Check

`GET /api/v1/health` — وضعیت database و redis را برمی‌گرداند.
این endpoint را در مانیتورینگ aaPanel/Uptime قرار دهید.
