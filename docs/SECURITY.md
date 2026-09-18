# Zarnama — Security Documentation

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
