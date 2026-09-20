# Zar30 — Security Documentation

## اصول امنیتی (Phase 0 Foundation)

### ۱. Environment Variables

- همه secrets در `.env` (gitignored) — `.env.example` فقط placeholder
- JWT secrets باید در production تغییر کنند (حداقل ۳۲ کاراکتر)
- Peppers برای password hashing و OTP

### ۲. Authentication

- Web: httpOnly + Secure + SameSite cookie
- Mobile: Secure token storage (Capacitor Preferences)
- JWT با jose — access + refresh token
- Session rotation + reuse detection

### ۳. Financial Security

- Double-Entry Ledger — هر تراکنش balanced
- Immutable LedgerEntry — اصلاح فقط با Reversal
- PostgreSQL مرجع نهایی — Redis هرگز مرجع نیست
- Idempotency-Key برای جلوگیری از duplicate effects
- Row-level locking با SELECT FOR UPDATE

### ۴. Offline Financial Operations — ممنوع

- هیچ عملیات مالی Offline Queue نمی‌شود
- IndexedDB فقط برای non-financial data
- Financial state فقط server-authoritative

### ۵. API Security

- RFC 7807 error responses — جزئیات داخلی نشت نمی‌شود
- Request ID برای tracing
- Security headers (X-Content-Type-Options, X-Frame-Options, ...)
- Rate limiting configurable (RateLimitConfig table)

### ۶. Input Validation

- Zod برای همه ورودی‌ها
- اعتبارسنجی موبایل ایرانی، کد ملی، OTP، رمز عبور، شبا

### ۷. Logging

- Structured logging با Pino
- Redaction برای password, OTP, tokens, secrets
- لاگ‌ها به انگلیسی — بدون اطلاعات حساس

### ۸. موارد امنیتی در Phaseهای بعدی

- OTP security (TTL, attempts, cooldown)
- Session rotation + reuse detection
- RBAC + granular permissions
- CSRF protection
- XSS/CSP headers
- SQL injection prevention (Prisma handles)
- SSRF allowlist
- Secure file uploads
- IDOR prevention
- Encryption at rest
- Admin security
- Fraud detection
- Audit logs (foundation آماده — audit_logs table)
- Backup + disaster recovery

---

## امنیت Authentication — پیاده‌سازی Phase 2 (2026-09-18)

### معماری Token

| Token         | محل                                 | مدت      | نکته                                  |
| ------------- | ----------------------------------- | -------- | ------------------------------------- |
| Access (JWT)  | httpOnly cookie `zar30_at` / Bearer | ۱۵ دقیقه | حاوی `sid` — بررسی نشست در هر request |
| Refresh (JWT) | httpOnly cookie `zar30_rt` / body   | ۳۰ روز   | rotation + reuse detection            |

- `sid` در access token → revoke شدن Session بلافاصله روی همه APIها اثر می‌کند (بررسی `revokedAt`/`expiresAt` در `requireAuth`)
- Refresh token فقط hash آن در DB نگه داشته می‌شود (`refreshTokenHash`)
- Reuse شدن refresh token قدیمی → همه Sessionهای کاربر revoke می‌شوند (theft detection)

### OTP

- ۶ رقم، TTL پیش‌فرض ۱۲۰ ثانیه، حداکثر ۵ تلاش، cooldown ارسال مجدد ۶۰ ثانیه
- OTP با `OTP_PEPPER` هش و ذخیره می‌شود — plaintext هرگز در DB نیست
- مصرف‌شده/منقضی‌شده قابل استفاده مجدد نیست (replay resistant)
- Rate limit جداگانه برای `otp.send` و `otp.verify`

### Password

- bcrypt (cost پیش‌فرض ۱۲) + `PASSWORD_PEPPER` سروری
- Pepper فقط در env — در DB ذخیره نمی‌شود
- forgot/reset با OTP؛ پس از reset همه Sessionها revoke می‌شوند
- change نیازمند احراز + رمز فعلی؛ پس از تغییر سایر نشست‌ها revoke می‌شوند

### Brute Force Protection

- شمارنده `failedLoginAttempts` + `lockedUntil` روی User — پس از ۵ تلاش قفل موقت
- پیام خطای generic — وجود/عدم وجود حساب فاش نمی‌شود
- Rate limit `auth.login` per-mobile

### Session / Device Management

- `GET /api/v1/auth/sessions` — فقط نشست‌های همان کاربر (فیلتر `userId` از token — جلوگیری IDOR)
- `DELETE /api/v1/auth/sessions/[id]` — فقط نشست خود کاربر
- Logout idempotent — با token نامعتبر هم cookieها پاک می‌شوند

### Rate Limiting (Configurable)

قوانین از جدول `RateLimitConfig` خوانده می‌شوند (Redis sliding window) — بدون تغییر کد قابل تنظیم:

| کلید                  | پیش‌فرض | scope  |
| --------------------- | ------- | ------ |
| `api.general`         | 100/60s | ip     |
| `otp.send`            | 5/h     | mobile |
| `otp.verify`          | 10/h    | mobile |
| `auth.login`          | 10/h    | mobile |
| `auth.register`       | 10/h    | ip     |
| `auth.password_reset` | 5/h     | mobile |

### SMS Provider

- Interface `SmsProvider` — پیاده‌سازی `MockSmsProvider` و `KavenegarProvider`
- انتخاب با `SMS_PROVIDER` (نه NODE_ENV) — در production باید `kavenegar`
- Mock کد را در Redis `devotp:{mobile}` می‌نویسد + در لاگ با موبایل masked چاپ می‌کند
- endpoint توسعه `GET /api/v1/dev/otp/[mobile]` فقط وقتی `DEV_OTP_ENDPOINT=true` و `SMS_PROVIDER=mock` — در production هرگز فعال نشود

### Audit

رویدادهای auth در `audit_logs`: `USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`, `SESSION_REVOKE`, `PASSWORD_RESET`, `PASSWORD_CHANGE`, `REFRESH_REUSE_DETECTED` — با actor, ip, userAgent.

## Phase 3 — User Panel

### User Data Isolation

- `userId` فقط از JWT (`requireAuth`) استخراج می‌شود — هیچ endpointای user id را از client نمی‌پذیرد
- نشست/اعلان کاربر دیگر → `404` (IDOR-safe — وجود منبع فاش نمی‌شود)
- `markNotificationRead` ابتدا مالکیت را با `findFirst({id, userId})` بررسی می‌کند — idempotent

### Profile Update

- `profileUpdateSchema` فقط `firstName`/`lastName`/`email`/`avatarUrl` را می‌پذیرد
- `mobile`، `kycLevel`، `status`، `referralCode` از این مسیر strip می‌شوند — تغییر آن‌ها فقط از جریان‌های اختصاصی (OTP/KYC/admin)

### Session Management (User Panel)

- `DELETE /users/sessions` → خروج از سایر نشست‌ها با `keepSessionId` — نشست جاری حفظ می‌شود
- رویدادهای `PROFILE_UPDATE`، `SESSION_REVOKE`، `SESSION_REVOKE_OTHERS`، `SESSION_REVOKE_ALL` در `audit_logs`
- صفحه Security Center رویدادهای `audit_logs` خود کاربر را نمایش می‌دهد (حداکثر ۵۰)

### Route Protection (دو لایه)

- **Edge**: proxy روی `/dashboard/*` — بدون cookie → redirect به `/login?callbackUrl=...`
- **API**: `requireAuth` — verify JWT + بررسی status کاربر + بررسی نشست فعال (`sid`)

## Phase 4 — KYC

### داده حساس و رمزنگاری

- فیلدهای بانکی (`cardNumberEnc`/`ibanEnc`) با **AES-256-GCM** در DB رمزنگاری می‌شوند — plaintext هرگز ذخیره/در API برگردانده نمی‌شود (فقط masked)
- کلید: `KYC_ENCRYPTION_KEY` (env) — ۳۲ بایت hex؛ در production از secrets manager
- فایل‌های مدارک قبل از upload به `iv|tag|ciphertext` رمزنگاری می‌شوند — دستکاری با auth tag شکست می‌خورد

### File Upload Security

- **MIME sniff با magic bytes** — header کلاینت قابل‌اعتماد نیست؛ فقط JPEG/PNG/WebP
- Cap ۵MB + فایل خالی رد می‌شود
- Key تصادفی `kyc/{userId}/{submissionId}/{docId}` — بدون path traversal، غیرقابل‌حدس
- **Bucket خصوصی** — هیچ Public URL؛ GET فقط از route احرازشده با `no-store` + `nosniff`
- Rate limit `kyc.upload` (۱۲/ساعت per user)

### Authorization

- `userId` فقط از JWT — IDOR با 404 پاسخ می‌دهد
- `requireAdmin`: session کاربر + رکورد فعال `admin_users` — برای queue/claim/review و دانلود مدرک کاربران
- State machine سروری — هیچ انتقال نامعتبری (مثل claim روی draft یا submit دوباره) `409`

### Audit

`KYC_STARTED`، `KYC_DOC_UPLOADED` (kind+sha256)، `KYC_DOC_DELETED`، `KYC_SUBMITTED`، `KYC_UNDER_REVIEW`، `KYC_APPROVED`، `KYC_REJECTED`، `KYC_NEEDS_RESUBMISSION` — با actor (user/admin)، before/after status، reason.

`LEGAL REVIEW REQUIRED`: سیاست نگه‌داری (retention) مدارک، مدت‌زمان و شرایط حذف نیازمند بررسی حقوقی است.
