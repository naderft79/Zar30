# Phase 4 Report — KYC & Identity Verification

**تاریخ:** 2026-09-20 | **وضعیت:** ✅ DONE (سطح ۲ — core flow) | **ADR:** ADR-020

## دامنه پیاده‌سازی‌شده

- فلوی کامل احراز هویت **سطح ۲** داخل «پروفایل» (`/dashboard/profile/kyc`) — بدون تغییر Navigation Contract
- State machine سروری صریح و قابل audit
- آپلود امن مدارک به Object Storage خصوصی با رمزنگاری AES-256-GCM
- APIهای ادمین برای صف بررسی و تصمیم (UI پنل ادمین در Phase مربوطه)

## معماری

```text
کاربر → /dashboard/profile/kyc (wizard)
  → POST /api/v1/kyc/start        (draft idempotent + prefill از ردشده قبلی)
  → PUT  /api/v1/kyc/draft        (مرحله‌به‌مرحله، currentStep سروری)
  → POST /api/v1/kyc/documents    (multipart → MIME sniff → AES-GCM → S3 private)
  → POST /api/v1/kyc/submit       (کامل‌بودن سروری → SUBMITTED)
ادمین → GET /api/v1/admin/kyc/queue → claim → review(approve|reject|request_changes)
  → approve: kycLevel کاربر ارتقا + Notification + Audit (در یک transaction)
```

## State Machine

```text
NOT_STARTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW
  → APPROVED | REJECTED | NEEDS_RESUBMISSION
```

- انتقال نامعتبر → `409`؛ نقش مستقیم `SUBMITTED → APPROVED` (بدون claim) هم مجاز
- `REJECTED`/`NEEDS_RESUBMISSION` → submission جدید (تاریخچه immutable، prefill فیلدها؛ مدارک باید مجدد آپلود شوند)

## امنیت

| لایه       | پیاده‌سازی                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------- | --- | ---------------------------------------- |
| Auth       | `requireAuth` (JWT + session)؛ `requireAdmin` (session + admin_users فعال)                         |
| IDOR       | مالکیت در service — 404 (وجود منبع فاش نمی‌شود)                                                    |
| Upload     | MIME magic bytes (JPEG/PNG/WebP)، cap ۵MB، فایل خالی رد، key تصادفی                                |
| Encryption | `KYC_ENCRYPTION_KEY` — فایل‌ها `iv                                                                 | tag | ct`در S3؛ کارت/شبا`v1:iv:tag:data` در DB |
| Storage    | MinIO/S3 bucket خصوصی — بدون Public URL؛ GET با `Cache-Control: no-store`                          |
| Rate limit | `kyc.upload` = ۱۲/ساعت per user                                                                    |
| Audit      | `KYC_STARTED/DOC_UPLOADED/DOC_DELETED/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/NEEDS_RESUBMISSION` |
| Validation | سرور: کدملی checksum، شبا mod-97، کارت ۱۶رقم، تولد ۱۸+ — کلاینت فقط UX                             |

## UI (Design System)

- Step rail طلایی ۵‌مرحله‌ای (موبایل: آیکون فشرده — دسکتاپ: label کامل) + `aria-current="step"`
- Draft سروری — کاربر هر وقت برگردد از همان مرحله ادامه می‌دهد
- تاریخ تولد جلالی (روز/ماه/سال) → تبدیل دقیق به میلادی (`src/lib/utils/jalali.ts` — الگوریتم jalaali)
- Upload با progress bar + مشاهده/حذف مدرک + stateهای loading/error
- Status hero برای SUBMITTED/UNDER_REVIEW؛ کارت دلیل + CTA برای REJECTED/NEEDS_RESUBMISSION
- تاریخچه درخواست‌ها + badge سطح فعلی

## تست‌ها

| لایه        | تعداد          | پوشش                                                                                                                                          |
| ----------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | ۱۲             | validators، AES-GCM roundtrip + tamper، jalali conversion/leap                                                                                |
| Integration | ۸              | state machine، idempotent start، MIME sniff، submit guard، IDOR، approve→kycLevel+notif+audit، reject+reason+resubmission، invalid transition |
| E2E         | ۴ × ۳ viewport | فلو کامل با آپلود واقعی MinIO، validation سروری، 401 unauthorized، nav contract                                                               |

## فایل‌های کلیدی

- `src/lib/services/kyc.service.ts` — state machine + draft + upload + review
- `src/lib/crypto/aes-gcm.ts` · `src/lib/storage/s3.ts` · `src/lib/validators/kyc.ts` · `src/lib/utils/jalali.ts`
- `src/app/api/v1/kyc/*` · `src/app/api/v1/admin/kyc/*`
- `src/components/panel/kyc-client.tsx` · `src/app/dashboard/profile/kyc/page.tsx`
- `prisma/migrations/20260920061737_kyc_flow/`

## موارد خارج از دامنه (Phaseهای بعدی)

- سطح ۳: سلفی ویدیویی + face match (`face-api.js`) + OCR (`tesseract.js`)
- Admin Review UI در پنل ادمین (API آماده است)
- Operation limits بر اساس `kycLevel` در موتورهای مالی (هنگام پیاده‌سازی آن موتورها)
- **`LEGAL REVIEW REQUIRED`** — سیاست retention مدارک و متن حریم خصوصی KYC

## نتایج

`lint ✅` · `typecheck ✅` · `unit+integration 93/93 ✅` · `E2E kyc 12/12 (۳ viewport) ✅` · `build ✅`
