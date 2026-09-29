# Zar30 — راهنمای Deployment روی aaPanel (بدون Docker)

این سند راهنمای کامل اجرای Zar30 روی یک VPS لینوکسی با aaPanel است.
هیچ بخشی از این مسیر به Docker نیاز ندارد.

## معماری نهایی

```text
Internet
   ↓
Nginx (aaPanel) :443 — SSL termination
   ↓ proxy to 127.0.0.1:3000
Next.js (PM2 → Node 24)
   ↓
PostgreSQL 16+ (127.0.0.1:5432)
   ↓
Redis 7 (127.0.0.1:6379)
```

- تنها نقطه‌ی ورودی عمومی: Nginx روی 443
- پورت 3000 (Next)، 5432 (Postgres)، 6379 (Redis) فقط روی localhost بایند می‌مانند
- Object storage (مدارک KYC) از طریق ENV به هر S3-compatible سرویسی وصل می‌شود

---

## ۱. پیش‌نیازهای سیستم (Ubuntu/Debian)

```bash
# Node.js 24 LTS — از NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm (نسخه‌ای که packageManager در package.json مشخص می‌کند)
npm i -g pnpm

# PM2
npm i -g pm2

# ابزارهای build (برای native deps مثل bcrypt/sharp)
sudo apt install -y build-essential
```

## ۲. PostgreSQL (native)

اگر PostgreSQL را از پنل aaPanel نصب نکرده‌اید، مستقیم نصب کنید:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

ساخت دیتابیس و کاربر:

```bash
sudo -u postgres psql
```

```sql
CREATE USER zar30 WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE zar30 OWNER zar30;
GRANT ALL PRIVILEGES ON DATABASE zar30 TO zar30;
\q
```

**امنیت:** فایل `pg_hba.conf` باید فقط اتصال `127.0.0.1` را مجاز کند
(پیش‌فرض Ubuntu همین است — `host ... 127.0.0.1/32`). پورت 5432 را در فایروال باز نکنید.

## ۳. Redis (native)

```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
redis-cli ping   # باید PONG برگرداند
```

**امنیت:** در `/etc/redis/redis.conf` خط `bind 127.0.0.1 -::1` باید فعال باشد
و `protected-mode yes`. پورت 6379 را public نکنید. در صورت نیاز `requirepass` ست کنید
و در `REDIS_URL` قرار دهید: `redis://:PASSWORD@127.0.0.1:6379`.

## ۴. Clone و نصب

```bash
cd /www/wwwroot          # مسیر پیش‌فرض سایت‌های aaPanel
git clone <REPO_URL> zar30
cd zar30
pnpm install --frozen-lockfile
```

## ۵. Environment

```bash
cp .env.example .env
nano .env
```

تمام `CHANGE_ME_*`ها را پر کنید. نکات مهم:

- `NEXT_PUBLIC_APP_URL=https://zar30.com`
- `DATABASE_URL` → `postgresql://zar30:PASS@127.0.0.1:5432/zar30?schema=public`
- `REDIS_URL` → `redis://127.0.0.1:6379`
- `JWT_ACCESS_SECRET` و `JWT_REFRESH_SECRET` → حداقل ۳۲ کاراکتر تصادفی و متفاوت
- `KYC_ENCRYPTION_KEY` → دقیقاً ۶۴ کاراکتر hex
- `PAYMENT_CALLBACK_URL=https://zar30.com/api/v1/payments/callback`

تولید secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## ۶. Prisma

```bash
pnpm db:generate        # تولید Prisma Client
pnpm db:deploy          # prisma migrate deploy — فقط این در production
```

هرگز روی production از `prisma migrate dev` یا `db:push` استفاده نکنید.

## ۷. Build

```bash
pnpm build
```

اگر حافظه‌ی VPS کم است (زیر ~۴GB)، build را با حافظه‌ی بیشتر یا روی دستگاه دیگر انجام دهید:

```bash
NODE_OPTIONS="--max-old-space-size=6144" pnpm build
```

## ۸. اجرای اپ با PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup        # دستور systemd را که می‌دهد اجرا کنید — بعد از reboot خودکار بالا می‌آید
```

مدیریت:

```bash
pm2 status
pm2 logs zar30
pm2 restart zar30
pm2 reload zar30    # در صورت نیاز به reload نرم
```

## ۹. سایت در aaPanel

### ۹-۱. ساخت Website

در aaPanel: **Website → Add site**

- Domain: `zar30.com` و `www.zar30.com`
- نوع: Static site (Document root مهم نیست — همه‌چیز proxy می‌شود)

### ۹-۲. SSL

در تنظیمات همان سایت: **SSL → Let's Encrypt** — گواهی برای هر دو دامنه صادر و auto-renew را فعال کنید.

### ۹-۳. Reverse Proxy

از بخش **Reverse Proxy** سایت یک proxy بسازید:

- Target URL: `http://127.0.0.1:3000`

سپس در **Config file** همان سایت، محتوای `deploy/nginx/zar30.conf` را مرجع بگیرید و
موارد زیر را مطمئن شوید در location اصلی هستند:

```nginx
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        "upgrade";
client_max_body_size 10m;
proxy_read_timeout 90s;
```

بدون `X-Forwarded-Proto=https` کوکی‌های Secure و redirectها درست کار نمی‌کنند.

### ۹-۴. فایروال aaPanel

فقط 80 و 443 (و SSH) باز باشند. 3000، 5432، 6379، 9000 بسته‌اند.

## ۱۰. WebSocket / SSE

پروژه `socket.io` در dependencies دارد؛ اگر realtime feature فعال شود، همان upgrade headers
در کانفیگ بالا کافی است. در غیر این صورت ضرری ندارد که headerها بمانند.

## ۱۱. آپلودها

آپلود مدارک KYC به S3-compatible storage می‌رود (نه دیسک محلی) — `S3_*` را در `.env` ست کنید.
`client_max_body_size 10m` در Nginx برای مدارک کافی است.

## ۱۲. لاگ‌ها

```bash
pm2 logs zar30                 # لاگ اپ
tail -f logs/out.log           # فایل‌های PM2
tail -f /www/wwwlogs/zar30.com.log        # Nginx access (aaPanel)
sudo journalctl -u postgresql  # Postgres
tail -f /var/log/redis/redis-server.log   # Redis
```

هیچ dependency روی `docker logs` وجود ندارد.

## ۱۳. Update workflow

```bash
cd /www/wwwroot/zar30

# ۱) backup قبل از تغییرات DB
sudo -u postgres pg_dump zar30 | gzip > /root/backups/zar30-$(date +%F-%H%M).sql.gz

# ۲) آپدیت کد
git pull
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy

# ۳) build و restart
pnpm build
pm2 restart zar30
```

## ۱۴. Backup

```bash
# دیتابیس — روزانه با cron
sudo -u postgres pg_dump zar30 | gzip > /root/backups/zar30-$(date +%F).sql.gz

# بازیابی
gunzip -c zar30-YYYY-MM-DD.sql.gz | sudo -u postgres psql zar30
```

Object storage (مدارک KYC) را طبق راهنمای provider خود آن بکاپ بگیرید.

## ۱۵. Smoke Test بعد از deploy

```bash
curl -s https://zar30.com/api/v1/health | jq .
# انتظار: "status":"healthy" با database=ok و redis=ok
```

سپس در مرورگر: `https://zar30.com` → ثبت‌نام/ورود با OTP → یک صفحه داشبورد.
PWA: در DevTools → Application → Service Workers رجیستر شدن `serwist/sw.js` را چک کنید.
