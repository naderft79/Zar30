# Zarnama — Phase 3 Report: User Panel & Profile

**تاریخ:** 2026-09-18
**وضعیت:** ✅ DONE — Final Gate پاس شد

> نکته Roadmap: طبق اصلاحیه کاربر، شماره‌گذاری با MEGAPLAN هماهنگ شد — این Phase «User Panel & Profile» است و KYC به Phase 4 منتقل شد.

---

## 1. بخش‌های ساخته‌شده

| بخش             | فایل(ها)                                                                | توضیح                                                                          |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Panel Shell     | `src/components/panel/panel-shell.tsx`                                  | auth gate + user context + sidebar دسکتاپ + bottom nav موبایل (۷ آیتم)         |
| Dashboard       | `src/app/dashboard/page.tsx` + `dashboard-overview.tsx`                 | welcome + وضعیت حساب + KYC preview + دارایی/تراکنش placeholder + quick actions |
| Profile         | `src/app/dashboard/profile/page.tsx` + `profile-client.tsx`             | مشاهده + ویرایش واقعی نام/نام خانوادگی/ایمیل                                   |
| Security Center | `src/app/dashboard/security/page.tsx` + `security-client.tsx`           | وضعیت امنیت (OTP/2FA) + تغییر رمز + رویدادهای امنیتی                           |
| Sessions        | `src/app/dashboard/sessions/page.tsx` + `sessions-client.tsx`           | device/os/browser/IP + «نشست جاری» + لغو تکی + خروج از سایر نشست‌ها            |
| Notifications   | `src/app/dashboard/notifications/page.tsx` + `notifications-client.tsx` | لیست + mark-as-read + empty state                                              |
| Referral        | `src/app/dashboard/referral/page.tsx` + `referral-client.tsx`           | کد دعوت + آمار preview                                                         |
| Support         | `src/app/dashboard/support/page.tsx` + `support-client.tsx`             | تیکت preview + لینک‌های تماس                                                   |
| User Service    | `src/lib/services/user.service.ts`                                      | منطق دامنه users — isolation از `userId` توکن                                  |
| Validators      | `src/lib/validators/users.ts`                                           | `profileUpdateSchema` — فیلدهای حساس strip می‌شوند                             |
| UA Parser       | `src/lib/utils/user-agent.ts`                                           | تجزیه سبک device/os/browser                                                    |

## 2. Routes

### Pages (محافظت‌شده — proxy + requireAuth)

`/dashboard` · `/dashboard/profile` · `/dashboard/security` · `/dashboard/sessions` · `/dashboard/notifications` · `/dashboard/referral` · `/dashboard/support`

### API (`/api/v1/users/*`)

| Method | Path                             | توضیح                                                  |
| ------ | -------------------------------- | ------------------------------------------------------ |
| GET    | `/users/me`                      | پروفایل کامل کاربر جاری                                |
| PUT    | `/users/profile`                 | ویرایش profile — mobile/kyc/status غیرقابل تغییر       |
| GET    | `/users/sessions`                | نشست‌های فعال + `isCurrent`                            |
| DELETE | `/users/sessions`                | خروج از سایر نشست‌ها (نشست جاری حفظ می‌شود)            |
| DELETE | `/users/sessions/{id}`           | لغو یک نشست — فقط نشست خود کاربر (404 برای کاربر دیگر) |
| GET    | `/users/notifications`           | لیست اعلان‌ها (حداکثر ۱۰۰)                             |
| POST   | `/users/notifications/{id}/read` | علامت خوانده‌شده — idempotent + isolation              |
| GET    | `/users/security-events`         | ۵۰ رویداد امنیتی اخیر از audit_logs                    |

## 3. Security

- **User isolation**: `userId` فقط از JWT؛ تست IDOR — نشست/اعلان کاربر دیگر → 404
- **Route protection دولایه**: proxy (edge) + `requireAuth` (JWT + status + session check با `sid`)
- **Profile**: `profileUpdateSchema` فیلدهای حساس را strip می‌کند
- **Audit**: `PROFILE_UPDATE`، `SESSION_REVOKE`، `SESSION_REVOKE_OTHERS`، `SESSION_REVOKE_ALL`
- **داده مالی**: همه کارت‌ها placeholder با برچسب «به‌زودی — پیش‌نمایش» — هیچ balance/transaction جعلی

## 4. Tests

| نوع         | تعداد               | نتیجه      |
| ----------- | ------------------- | ---------- |
| Unit        | 13                  | ✅         |
| Integration | 10                  | ✅         |
| E2E         | 4 flow × 3 viewport | ✅ 12 pass |

**پوشش integration:** getUserProfile، updateProfile (+audit)، mobile immutable، isCurrent، IDOR session revoke، revoke-others keep-current، notification isolation + idempotency، notifications isolation، security-events isolation

**پوشش E2E:** Login → Dashboard → Profile edit → Security → Sessions (revoke others) → Notifications → Referral → Support → Logout + Unauthorized → callbackUrl → Dashboard + API 401 isolation + bottom nav موبایل

## 5. Final Gate

| مورد             | نتیجه                          |
| ---------------- | ------------------------------ |
| `pnpm lint`      | ✅ 0 errors / 0 warnings       |
| `pnpm typecheck` | ✅ 0 errors                    |
| `pnpm test`      | ✅ 73/73 (۱۲ فایل)             |
| `pnpm test:e2e`  | ✅ 45 pass / 3 skip (viewport) |
| `pnpm build`     | ✅ ۴۶ route + Serwist          |

## 6. Acceptance Matrix

| معیار                          | وضعیت |
| ------------------------------ | ----- |
| Dashboard واقعی و responsive   | ✅    |
| Profile + update واقعی         | ✅    |
| Session Management + Revoke    | ✅    |
| Logout All (سایر نشست‌ها)      | ✅    |
| Security Center                | ✅    |
| Route Protection + callbackUrl | ✅    |
| User Isolation تست‌شده         | ✅    |
| Mobile UX اختصاصی              | ✅    |
| بدون داده مالی جعلی            | ✅    |
| Lint/Typecheck/Test/E2E/Build  | ✅    |

## 7. مشکلات و رفع‌ها

1. `user-agent.h` C++ اشتباه → حذف؛ `user-agent.ts` با کامنت فارسی
2. `markNotificationRead` → idempotent + بررسی مالکیت جداگانه
3. `parseUserAgent` → iPad/تبلت Android قبل از mobile بررسی می‌شود
4. E2E rate limit (۱۵ ثبت‌نام > ۱۰/ساعت per IP) → کاربر تست از service layer ساخته می‌شود
5. E2E strict mode → scope به `main` (sidebar در موبایل hidden است)
6. `DATABASE_URL` در Playwright runner → `dotenv/config` در playwright.config
7. `dashboard-client.tsx` قدیمی بدون ارجاع → حذف

## 8. تصمیم‌های معماری

- صفحات پنل زیر `/dashboard/*` → proxy موجود بدون تغییر همه را پوشش می‌دهد
- `user.service.ts` دامنه مستقل users — session helpers از `lib/auth/session` مشترک‌اند
- `revokeAllOtherSessions(userId, keepSessionId)` — نشست جاری در logout-others حفظ می‌شود
- اعلان‌ها از مدل `Notification` موجود schema — engine کامل در Phase مربوطه
- کامنت‌ها فارسی / لاگ‌ها انگلیسی (convention پروژه)

## 9. Phase بعدی پیشنهادی

**Phase 4 — KYC**: workflow احراز هویت، document upload، verification، review — فیلدهای `kycLevel` و `KycSubmission` در schema آماده‌اند.
