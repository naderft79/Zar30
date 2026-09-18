# EXECUTION-MASTER-PROMPT.md — پرامپت اجرای پروژه زرنما

> این فایل پرامپت اصلی برای اجرای MEGAPLAN پروژه «زرنما» است.
> هر Agent توسعه باید این فایل و `MEGAPLAN.md` را قبل از شروع کار به طور کامل بخواند.

---

## دستور اجرا

وقتی عبارت `EXECUTE MEGAPLAN` را دریافت کردی، به ترتیب زیر عمل کن:

### ۱. آماده‌سازی
1. فایل `MEGAPLAN.md` را به طور کامل بخوان.
2. فایل `AGENTS.md` را بخوان (قوانین کلی).
3. `MASTER CHECKLIST` (بخش ۳۵ MEGAPLAN) را به‌عنوان مرجع پیشرفت استفاده کن.
4. برای هر فاز یک todo list ایجاد کن.

### ۲. ترتیب اجرا
طبق Dependency Graph (بخش ۲۹ MEGAPLAN) پیش برو:

```
Phase 0 (setup) → Phase 1 (landing)
Phase 0 → Phase 2 (auth)
Phase 2 → Phase 3 (user panel)
Phase 3 + Phase 4 (KYC) + Phase 5 (price) → Phase 6 (trading) → Phase 7 (wallet)
Phase 7 → Phase 8 (installment), 9 (investment), 10 (assets), 11 (ticket), 12 (referral), 13 (notification)
Phase 3 → Phase 14-16 (admin) — parallel
Phase 17 (security) — cross-cutting در همه فازها
Phase 18 (PWA) — بعد از Phase 1 + 3
Phase 19 (testing) — cross-cutting
Phase 20 (devops) — بعد از Phase 0
```

### ۳. MVP (نسخه اول قابل انتشار)
فازهای MVP:
- Phase 0, 1, 2, 3, 4, 5, 6, 7, 11, 13, 14, 15, 16, 17, 18, 20

### ۴. قوانین حین اجرا

1. **هیچ تصمیم معماری اصلی را بدون ثبت در MEGAPLAN.md تغییر نده.**
2. **پس از تکمیل هر فاز، MASTER CHECKLIST را به‌روز کن** (چک‌باکس‌ها را علامت بزن).
3. **Definition of Done را برای هر feature رعایت کن** (بخش ۳۲ MEGAPLAN).
4. **همزمان دسکتاپ و موبایل توسعه بده** (responsive + PWA).
5. **پنل ادمین فقط فارسی**، لاگ‌ها انگلیسی، کامنت فارسی.
6. **کارهارو مرحله به مرحله پیش ببر** و برای هر کار todo list بساز.
7. **امنیت را از ابتدا لحاظ کن**، نه بعدا.
8. **Ledger immutable** — هیچ آپدیت/حذف روی LedgerEntry.
9. **Double-Spending Prevention** با DB transaction + Redis lock.
10. **Idempotency-Key** برای تمام درخواست‌های مالی.

### ۵. پس از هر فاز

1. `MASTER CHECKLIST` را به‌روز کن.
2. `docs/` را به‌روز کن (در صورت نیاز).
3. تست‌های مربوطه را اجرا کن.
4. به کاربر گزارش بده (مختصر).

### ۶. موارد نیازمند تصمیم کاربر (DECISION REQUIRED)

مواردی که با `DECISION REQUIRED` یا `BUSINESS DECISION REQUIRED` در MEGAPLAN علامت‌گذاری شده‌اند را **بدون تایید کاربر اجرا نکن**. این موارد را به کاربر گزارش بده و منتظر تصمیم بمان.

---

## خلاصه دستور

```
EXECUTE MEGAPLAN
├── 1. بخوان MEGAPLAN.md + AGENTS.md
├── 2. ساخت todo list برای فاز فعلی
├── 3. اجرای فاز طبق ترتیب Dependency Graph
├── 4. رعایت Definition of Done
├── 5. به‌روزرسانی MASTER CHECKLIST
├── 6. گزارش مختصر به کاربر
└── 7. تکرار برای فاز بعدی
```

---

**منتظر دستور `EXECUTE MEGAPLAN` بمان.**
