# Phase 2 Report — Authentication & User Management

> تاریخ: 2026-09-18 | وضعیت: ✅ DONE

## خلاصه

احراز هویت کامل و Production-Ready پیاده‌سازی شد: Registration با OTP، Login با JWT دوگانه (access + refresh)، Session مدیریت‌شده در DB با revocation فوری، Password forgot/reset/change، Rate Limiting configurable، Brute Force Protection، RBAC foundation، و UI کامل فارسی/RTL — روی Web (cookie) و Mobile (Bearer).

## APIهای ساخته‌شده (`/api/v1/auth/*`)

| Endpoint                | توضیح                                   |
| ----------------------- | --------------------------------------- |
| `POST /register`        | ثبت‌نام → ارسال OTP (rate limit per-IP) |
| `POST /otp/send`        | ارسال/ارسال مجدد OTP با cooldown        |
| `POST /otp/verify`      | تایید → فعال‌سازی حساب                  |
| `POST /login`           | access + refresh — cookie + body        |
| `POST /refresh`         | rotation — reuse → revoke همه نشست‌ها   |
| `POST /logout`          | idempotent — cookie یا body             |
| `GET /me`               | پروفایل کاربر جاری                      |
| `GET /sessions`         | نشست‌های فعال — فقط خود کاربر           |
| `DELETE /sessions/{id}` | لغو نشست — فقط خود کاربر                |
| `POST /password/forgot` | OTP بازیابی                             |
| `POST /password/reset`  | reset → revoke همه نشست‌ها              |
| `POST /password/change` | با رمز فعلی — authenticated             |
| `GET /dev/otp/{mobile}` | فقط dev/test — دو شرط env               |

## صفحات UI (فارسی/RTL — هر دو Desktop و Mobile)

- `/login` `/register` `/verify-otp` (۶ رقم، auto-advance، paste، resend timer)
- `/forgot-password` `/reset-password`
- `/dashboard` — پروفایل + نشست‌های فعال + لغو + خروج (محافظت‌شده با Proxy)

## تصمیم‌های معماری

1. **`sid` در access token** — revoke فوری روی همه endpointها بدون انتظار انقضای JWT
2. **Refresh rotation + reuse detection** — token قدیمی دوباره بیاید، همه نشست‌ها revoke می‌شوند
3. **Web و Mobile یک Auth domain** — cookie (Web) + Bearer (Mobile) از یک API
4. **`SMS_PROVIDER` انتخاب provider** (نه NODE_ENV) — dev/test: `mock`، production: `kavenegar`
5. **Rate limits از `RateLimitConfig`** — تغییر بدون deploy؛ seed با `FALLBACK_RULES` هماهنگ
6. **Dev OTP endpoint دو شرطی** — `DEV_OTP_ENDPOINT=true` + `SMS_PROVIDER=mock` → در production 404

## فایل‌های کلیدی

- `src/lib/services/auth.service.ts` — منطق auth
- `src/lib/auth/{jwt,guard,session,otp,password,rbac,cookies}.ts`
- `src/lib/sms/sms-service.ts` — provider interface
- `src/app/api/v1/auth/**` — route handlers
- `src/components/auth/*` + `src/app/(auth)/*` + `src/app/dashboard/*`
- `src/proxy.ts` — حفاظت route + refresh cookie
- `tests/unit/auth.test.ts` + `tests/integration/auth.test.ts` + `tests/e2e/auth.spec.ts`

## مشکلات و رفع

| مشکل                                       | رفع                                                 |
| ------------------------------------------ | --------------------------------------------------- |
| `pepper` در create data User (فیلد نبود)   | حذف — pepper فقط env                                |
| Seed غیر idempotent (wallet unique)        | upsert + self-healing `mobileVerifiedAt`            |
| Revoke نشست روی `/me` اثر نمی‌کرد          | `sid` در access token + بررسی نشست در `requireAuth` |
| E2Eها با rate limit ۱ ساعته flake شدند     | `globalSetup` پاک‌سازی `ratelimit:*`                |
| Timeoutهای bcrypt زیر بار موازی            | `testTimeout: 30s` در vitest + `setTimeout` در e2e  |
| Playwright `pnpm start` → dev endpoint 404 | گذرگاه `DEV_OTP_ENDPOINT` + `SMS_PROVIDER=mock`     |

## Acceptance Matrix

| معیار                                     | وضعیت                |
| ----------------------------------------- | -------------------- |
| Registration / OTP / Login / Logout واقعی | ✅ e2e               |
| Session Revocation → Access Denied        | ✅ e2e + integration |
| Refresh rotation + reuse                  | ✅ integration       |
| OTP: replay/expired/wrong/brute-force     | ✅ integration       |
| User isolation (IDOR)                     | ✅ integration       |
| Rate Limiting configurable                | ✅ از DB             |
| Authorization server-side + RBAC          | ✅                   |
| Mobile/Auth architecture                  | ✅ Bearer + cookie   |
| lint / typecheck / test / e2e / build     | ✅ همه سبز           |

## نتایج Final Gate

- `pnpm lint` — 0 errors / 0 warnings
- `pnpm typecheck` — 0 errors
- `pnpm test` — **50/50** (unit + integration DB واقعی)
- `pnpm test:e2e` — **35 pass / 1 skip** (mobile-only) روی ۳ viewport
- `pnpm build` — موفق — ۳۵ route + Serwist SW

## نکته Production

- `SMS_PROVIDER` را `kavenegar` و `DEV_OTP_ENDPOINT` را `false` بگذارید — در غیر این صورت build هشدار `error` لاگ می‌کند.
