# ADR-017: Zar30 Global Rebranding & Technical Namespace Migration

> **LEGACY:** نام «زرنما / Zarnama / zarnama.ir» در این سند صرفاً برای ثبت تاریخچه Migration استفاده شده و Deprecated است.

- تاریخ: ۲۰۲۵
- وضعیت: **Accepted & Executed**
- Commit: پس از اجرا در گزارش Phase ثبت می‌شود

## تصمیم

هویت محصول به‌صورت دائمی و سراسری مهاجرت کرد:

| مورد               | قدیم (LEGACY)                        | جدید                             |
| ------------------ | ------------------------------------ | -------------------------------- |
| برند فارسی         | زرنما                                | **زرسی**                         |
| برند انگلیسی       | Zarnama / ZarNama / zarnama          | **zar30**                        |
| دامنه              | zarnama.ir                           | **zar30.com**                    |
| Package            | `zarnama`                            | `zar30`                          |
| App ID             | `ir.zarnama.app`                     | `com.zar30.app`                  |
| Database (dev)     | `zarnama_dev` / user `zarnama`       | `zar30_dev` / user `zar30`       |
| Cookies            | `zarnama_access` / `zarnama_refresh` | `zar30_access` / `zar30_refresh` |
| JWT                | iss `zarnama` / aud `zarnama-users`  | iss `zar30` / aud `zar30-users`  |
| Mobile storage key | `zarnama_refresh_token`              | `zar30_refresh_token`            |
| S3 bucket          | `zarnama`                            | `zar30`                          |
| Logger app         | `zarnama`                            | `zar30`                          |
| Error type URLs    | `https://zarnama.ir/errors/*`        | `https://zar30.com/errors/*`     |
| SMS template       | `zarnama-otp`                        | `zar30-otp`                      |

## Scope

Frontend، Backend، API error types، Prisma/env، Docker، PWA manifest، Capacitor/Android، Authentication namespace، JWT، SEO/JSON-LD، Notification templates، Logging، Tests، Documentation — بدون تغییر Business Logic.

## Migration Strategy

- Forward-only؛ Git history بازنویسی نشد
- `git mv` برای فایل/پوشه‌های برندمحور
- Prisma Client بازتولید شد؛ Schema تغییر ساختاری نداشت
- Dev database با recreate کانتینرها بازسازی می‌شود (Production هنوز وجود ندارد)

## Compatibility / Breaking Notes

- Sessionهای قدیمی (cookie `zarnama_*`) نامعتبر می‌شوند — قابل‌قبول در Development
- تغییر `appId` یعنی Android app جدید در store — pre-release OK
- قالب `zar30-otp` باید در Kavenegar ثبت شود (اقدام دستی)
- دامنه `zarnama.ir` در صورت انتشار قبلی → 301 redirect به `zar30.com` (در Deployment اعمال می‌شود)

## قانون دائمی

از این پس هیچ Feature/Agentی نباید نام LEGACY را وارد کند مگر در مستندات Migration با برچسب `LEGACY`. مرجع کامل: `docs/rebranding/ZAR30-REBRAND-AUDIT.md` و `AGENTS.md › PERMANENT BRAND IDENTITY`.
