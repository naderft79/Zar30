# ZAR30 Admin Architecture Gap Report

**تاریخ Audit:** 2026-09-20  
**دامنه:** Repository فعلی زرسی در برابر نیازمندی Full Admin Operations Center

## خلاصه اجرایی

Repository پایه‌های دامنه مالی، احراز هویت، KYC، audit، Redis/PostgreSQL/MinIO و Design System را دارد؛ اما هیچ route یا UI زیر `/admin/*` وجود ندارد و RBAC فعلی صرفاً foundation است. معماری درست، توسعه همین domain modelهاست؛ نه ساخت backend موازی یا dashboard نمایشی.

اصل اجرایی:

```text
Existing Domains + PostgreSQL Source of Truth
→ Admin Authentication (shared auth/session)
→ Granular Server RBAC
→ Domain Services
→ Versioned Admin APIs
→ Separate /admin UI
```

## دارایی‌های موجود

| حوزه           | وضعیت موجود                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Authentication | JWT access/refresh، cookie وب + bearer موبایل، refresh rotation، session revoke-aware          |
| Admin identity | `AdminUser(userId, role, permissions, active)` و ۹ نقش roadmap                                 |
| RBAC           | catalog کوچک `domain.action` + role defaults؛ هنوز به admin APIs متصل نیست                     |
| Audit          | `AuditLog` append-oriented با actor/action/entity/before/after/IP/user-agent                   |
| KYC            | flow سطح ۲ + secure documents + admin queue/claim/review APIs                                  |
| Finance schema | Wallet/AssetAccount، double-entry Journal/Ledger، Orders، Transactions، Withdrawals، GoldPrice |
| Products       | Installment، Investment، Referral، Ticket، Notification، CMS، FeatureFlag                      |
| API            | `/api/v1`، envelope typed، RFC-style errors، Zod، pagination contract مستند                    |
| UI             | Navy-first Design System، responsive cards/table، Dialog، states، PanelShell الگوی مرجع        |
| Infra          | PostgreSQL 18، Redis 7، MinIO/S3، Docker، structured Pino logging                              |
| Tests          | Vitest DB integration، Playwright سه viewport، lint/typecheck/build gates                      |

## Gapهای امنیتی بحرانی

1. **Permission enforcement ناقص:** `requireAdmin` فقط فعال‌بودن `AdminUser` را بررسی می‌کند؛ KYC queue/review به `kyc.read`/`kyc.review` متصل نیست.
2. **Custom permissions بلااستفاده:** `AdminUser.permissions` ذخیره می‌شود ولی guard آن را resolve یا enforce نمی‌کند.
3. **Audit privileged fail-open:** `writeAudit` خطا را log می‌کند و operation را fail نمی‌کند؛ برای approve/reject/financial/config mutation کافی نیست.
4. **Audit metadata ناقص:** request ID، actor role، reason و target user ستون اختصاصی ندارند.
5. **Page authorization:** proxy فقط وجود token را بررسی می‌کند؛ `/admin/*` باید پس از session validation، admin identity و permission کنترل شود.
6. **Concurrency:** KYC review state check و update اتمیک/locked نیست؛ دو reviewer می‌توانند روی وضعیت قدیمی تصمیم بگیرند.
7. **PII minimization:** سیاست masking بر اساس permission هنوز وجود ندارد.

## Gapهای محصول و عملیات

| حوزه                | Gap                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Admin shell         | route/layout/navigation/header/search/breadcrumb/mobile navigation وجود ندارد              |
| Tables              | primitive فعلی client-only است؛ server pagination/sort/filter/saved views ندارد            |
| Search              | global entity search و Ctrl+K وجود ندارد                                                   |
| Users               | list/detail/status actions/activity timeline وجود ندارد                                    |
| KYC                 | backend پایه موجود؛ review UI، document viewer و permission granular وجود ندارد            |
| Accounts/Ledger     | schema موجود؛ explorer و chain transaction→journal→entries وجود ندارد                      |
| Financial mutations | trading/deposit/withdrawal/pricing engines هنوز پیاده نشده‌اند؛ admin نباید shortcut بسازد |
| Risk/Fraud          | model/service/rules وجود ندارد                                                             |
| Internal notes      | model audit-friendly وجود ندارد                                                            |
| Team                | admin management/invite/session UI وجود ندارد                                              |
| API management      | API key/webhook model وجود ندارد                                                           |
| System health       | probe/service/UI وجود ندارد                                                                |
| Reports/Export      | server report/export و audit وجود ندارد                                                    |
| CMS/Flags           | models موجود؛ services/APIs/admin UI وجود ندارد                                            |

## تصمیم معماری تثبیت‌شده

### جداسازی route

- User Panel فعلی: `/dashboard/*` و قرارداد ناوبری ۵‌آیتمی بدون تغییر
- Admin Panel: `/admin/*`
- Admin API: `/api/v1/admin/*`
- Authentication مستقل ساخته نمی‌شود؛ همان user/session architecture استفاده می‌شود و `AdminUser` privilege را اضافه می‌کند.

### RBAC

- Permission catalog مرکزی در `src/lib/auth/rbac.ts`
- Role defaults مطابق `AdminRole`
- `AdminUser.permissions` به‌شکل override سازگار با legacy:
  - `{ "grant": ["domain.action"], "revoke": ["domain.action"] }`
  - آرایه legacy به‌عنوان grant خوانده می‌شود
- ترتیب enforce: auth → active session → active admin → resolved permissions → resource/state check → action
- UI فقط presentation gate است؛ API همیشه enforce می‌کند.

### Audit

- read actions معمولی structured log؛ privileged mutations strict audit
- mutationهای حساس و audit همان operation در یک DB transaction
- metadata: actor ID/role، action، entity، target user، request ID، IP، user-agent، reason، before/after
- `AuditLog` هیچ update/delete admin API ندارد.

### Financial safety

- ماژول‌های Wallet/Gold/Order/Transaction/Deposit/Withdrawal/Pricing تا زمان وجود domain mutation service، **read-only explorer واقعی** هستند.
- هیچ mock balance/price/revenue در production UI نمایش داده نمی‌شود.
- Deposit view از `Transaction(type=DEPOSIT)` استفاده می‌کند؛ model تکراری ساخته نمی‌شود.
- هر mutation آینده فقط از service مالی، DB transaction، durable idempotency و balanced ledger عبور می‌کند.

### UI

- Design hierarchy: ZAR30 tokens → existing primitives → UI Skills
- Desktop: fixed sectioned sidebar + dense operational workspace
- Tablet: collapsible drawer
- Mobile: top bar + navigation sheet + table-to-card
- Motion فقط transform/opacity، کوتاه، reduced-motion؛ کنترل‌ها native/accessibly named؛ dialogs با Radix focus management.

## دامنه پیاده‌سازی فعلی

### واقعی و operational

- Admin auth/RBAC/audit foundation
- Shell/navigation/command/breadcrumb
- Dashboard مبتنی بر DB واقعی با unavailable state به‌جای fake data
- Users، KYC review، Accounts، Wallets، Gold، Orders، Transactions، Deposits، Withdrawals
- Installments، Investments، Referrals، Support، Notifications
- Content، SEO metadata management، Reports، Risk/Security views، Audit Logs
- Team/Roles، Settings (existing rate limits)، System Health، Feature Flags

### بدون mutation تا آماده‌شدن domain engine

- balance correction، transaction reversal، deposit confirmation، withdrawal execution، order execution، pricing update، payout
- دلیل: engineهای authoritative مربوطه هنوز در repository وجود ندارند. ساخت admin shortcut نقض ledger و no-fake rule است.

### نیازمند تصمیم/فاز بعدی

- Risk/Fraud rules engine
- API key/webhook lifecycle
- job/queue operational replay
- Excel export
- Step-up authentication/TOTP برای privileged actions
- `LEGAL REVIEW REQUIRED`: retention/masking/export policy برای KYC و داده شخصی

## معیار موفقیت

- هیچ `/admin` بدون admin فعال قابل مشاهده نیست.
- هر API با permission server-side تست می‌شود.
- listها pagination/filter/sort سمت سرور دارند.
- mutations موجود reason + audit strict + state/concurrency guard دارند.
- داده مالی فقط PostgreSQL/ledger؛ Redis هرگز source of truth نیست.
- UI سه viewport، RTL، keyboard، focus و reduced-motion را پوشش می‌دهد.
- وضعیت نهایی صادقانه گزارش می‌شود؛ ماژولی که engine آن وجود ندارد DONE مالی اعلام نمی‌شود.
