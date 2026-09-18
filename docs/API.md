# Zarnama — API Documentation

> Base URL: `/api/v1` — همه پاسخ‌ها JSON با ساختار `{ data }` یا `{ error }` (RFC 7807)

## Authentication

### Session Model

- **Web**: httpOnly cookies — `zarnama_at` (access، ۱۵ دقیقه) و `zarnama_rt` (refresh، ۳۰ روز)
- **Mobile**: همان API — access token در `Authorization: Bearer` و refresh token در body ارسال می‌شود
- هر access token حاوی `sid` (شناسه Session) است → revoke شدن نشست بلافاصله اثر می‌کند

### Endpoints

| Method | Path                    | Auth    | توضیح                                                   |
| ------ | ----------------------- | ------- | ------------------------------------------------------- | ------- |
| POST   | `/auth/register`        | —       | ثبت‌نام با موبایل + رمز → ارسال OTP                     |
| POST   | `/auth/otp/send`        | —       | ارسال/ارسال مجدد OTP (`purpose: register                | reset`) |
| POST   | `/auth/otp/verify`      | —       | تایید OTP ثبت‌نام → فعال‌سازی حساب                      |
| POST   | `/auth/login`           | —       | ورود → access + refresh token                           |
| POST   | `/auth/refresh`         | refresh | rotation — توکن قدیمی reuse شود همه نشست‌ها لغو می‌شوند |
| POST   | `/auth/logout`          | —       | idempotent — refresh از body یا cookie                  |
| GET    | `/auth/me`              | access  | پروفایل کاربر جاری                                      |
| GET    | `/auth/sessions`        | access  | لیست نشست‌های فعال کاربر                                |
| DELETE | `/auth/sessions/{id}`   | access  | لغو یک نشست — فقط نشست خود کاربر                        |
| POST   | `/auth/password/forgot` | —       | ارسال OTP بازیابی رمز                                   |
| POST   | `/auth/password/reset`  | —       | reset با OTP → revoke همه نشست‌ها                       |
| POST   | `/auth/password/change` | access  | تغییر رمز با رمز فعلی                                   |

### POST /auth/register

```json
// Request
{ "mobile": "09123456789", "password": "Test@1234", "referralCode": "ABC123?" }
// 201 → OTP ارسال می‌شود؛ موبایل تکراری → 409
```

### POST /auth/login

```json
// Request
{ "mobile": "09123456789", "password": "Test@1234" }
// Response
{ "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }
// Web: توکن‌ها در httpOnly cookie هم ست می‌شوند
```

### POST /auth/refresh

```json
// Request (Mobile) — Web از cookie می‌خواند
{ "refreshToken": "..." }
// Response — rotation
{ "data": { "accessToken": "...", "refreshToken": "..." } }
```

### POST /auth/otp/verify

```json
{ "mobile": "09123456789", "code": "123456", "purpose": "register" }
// کد اشتباه → attempts+1 — پس از سقف، کد باطل و resend لازم است
```

### POST /auth/password/reset

```json
{ "mobile": "09123456789", "code": "123456", "newPassword": "NewPass@99" }
// موفق → همه Sessionهای قبلی revoke می‌شوند
```

## Users (Phase 3)

همه endpointها نیازمند access token — userId فقط از JWT استخراج می‌شود (هرگز از client).

| Method | Path                             | توضیح                                                              |
| ------ | -------------------------------- | ------------------------------------------------------------------ |
| GET    | `/users/me`                      | پروفایل کامل کاربر جاری (kycLevel، status، referralCode، ...)      |
| PUT    | `/users/profile`                 | ویرایش firstName/lastName/email/avatarUrl — mobile/kyc/status ثابت |
| GET    | `/users/sessions`                | نشست‌های فعال + device/os/browser + `isCurrent`                    |
| DELETE | `/users/sessions`                | خروج از سایر نشست‌ها — نشست جاری حفظ می‌شود                        |
| DELETE | `/users/sessions/{id}`           | لغو یک نشست — نشست کاربر دیگر → 404 (IDOR-safe)                    |
| GET    | `/users/notifications`           | اعلان‌های کاربر (حداکثر ۱۰۰، مرتب بر اساس جدیدترین)                |
| POST   | `/users/notifications/{id}/read` | علامت خوانده‌شده — idempotent، اعلان کاربر دیگر → 404              |
| GET    | `/users/security-events`         | ۵۰ رویداد امنیتی اخیر کاربر از audit_logs                          |

### PUT /users/profile

```json
// Request — همه فیلدها اختیاری
{ "firstName": "علی", "lastName": "رضایی", "email": "a@b.ir", "avatarUrl": null }
// mobile / kycLevel / status از این مسیر قابل تغییر نیستند (schema strip می‌کند)
// Response → { "data": { "user": {...} } } — رویداد PROFILE_UPDATE در audit ثبت می‌شود
```

### GET /users/sessions

```json
// Response
{
  "data": {
    "sessions": [
      {
        "id": "...",
        "device": "desktop",
        "os": "Windows",
        "browser": "Chrome",
        "ip": "127.0.0.1",
        "isCurrent": true,
        "createdAt": "...",
        "expiresAt": "..."
      }
    ]
  }
}
```

## سایر

| Method | Path                | توضیح                                                                |
| ------ | ------------------- | -------------------------------------------------------------------- |
| GET    | `/health`           | وضعیت db + redis                                                     |
| GET    | `/price`            | قیمت طلا — فعلاً `isLive: false` + `source: "demo"`                  |
| GET    | `/dev/otp/{mobile}` | فقط dev/test — نیازمند `DEV_OTP_ENDPOINT=true` + `SMS_PROVIDER=mock` |

## Rate Limiting

از `RateLimitConfig` (قابل تنظیم بدون deploy): `api.general`، `otp.send`، `otp.verify`، `auth.login`، `auth.register`، `auth.password_reset` — سرریز → `429` با پیام زمان retry.

## خطاها

- `401` توکن نامعتبر/منقضی/نشست لغوشده — `403` حساب مسدود/دسترسی ناکافی
- `409` موبایل تکراری — `422` ورودی نامعتبر — `429` rate limit
- پیام‌های خطای auth generic هستند — وجود حساب فاش نمی‌شود
