# MEGAPLAN — پلتفرم طلای آبشده زرنما

> سند جامع معماری و اجرای پروژه — نسخه 1.0
> نقش‌های هم‌زمان: CTO, Product Manager, UX/UI Designer, Frontend/Backend/Database/DevOps/Security/Mobile/QA/FinTech Architect, Business Analyst, SEO/Performance Engineer
> وضعیت: آماده اجرا — منتظر دستور `EXECUTE MEGAPLAN`

---

## تصمیمات قطعی (تایید شده)

| موضوع | تصمیم |
|---|---|
| استک فرانت | Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui |
| موبایل | PWA کامل + Capacitor (Android native-ready, iOS PWA) |
| بک‌اند | Next.js Route Handlers (تک پروژه) |
| ORM/DB | PostgreSQL + Prisma |
| کش/صف | Redis (ioredis) + BullMQ |
| Real-time | Socket.io (قیمت لحظه‌ای، چت تیکت، اعلان‌ها) |
| احراز هویت | JWT (access + refresh) httpOnly cookie + OTP + 2FA اختیاری |
| KYC | سه‌سطحی (موبایل → کارت ملی → سلفی+ویدیو) |
| ساختار | تک repo Next.js (app/ + api/) |
| MVP | گسترده (همه ماژول‌های اصلی + پنل ادمین) |
| زبان/RTL | فارسی RTL، کامنت فارسی، لاگ انگلیسی |
| رنگ | Navy `#1a2a4f`، Gold `#c9a227`، Cream `#f5ecd7` |
| قیمت طلا | API خارجی + ویرایش دستی ادمین |
| قسطی | هر دو (اعتبارسنجی داخلی + چک صیادی با ضامن) |
| سوددهی | به صورت طلا (تورم‌زدا) |
| نوتیفیکیشن | Web Push + FCM + APNs + درون‌اپ + SMS + ایمیل |

---

## بخش ۱ — Executive Summary

«زرنما» یک پلتفرم FinTech برای خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده ۱۸ عیار است. کاربر می‌تواند با هر مبلغی (حتی یک میلی‌گرم) طلا بخرد، بفروشد، در طرح‌های سوددهی سرمایه‌گذاری کند، خرید قسطی انجام دهد و در صورت رسیدن به حدنصاب، طلا را به‌صورت فیزیکی تحویل بگیرد.

**مزیت رقابتی**: تجربه پریمیوم، شفافیت کامل، Ledger قابل حسابرسی، معماری مقیاس‌پذیر، پشتیبانی کامل موبایل (PWA + Android native-ready).

**اهداف فنی**:
- Web + PWA + Android + iOS از یک Backend مشترک
- معماری Domain-Driven، قابل Scale
- امنیت FinTech-grade از ابتدا
- Ledger immutable با Double-Spending Prevention
- Core Web Vitals سبز، LCP < 2.5s

---

## بخش ۲ — Product Vision

**چشم‌انداز**: زرنما ساده‌ترین، امن‌ترین و شفاف‌ترین راه برای پس‌انداز و سرمایه‌گذاری روی طلا در ایران باشد.

**مأموریت**: حذف واسطه‌های سنتی، اجرت ساخت و مالیات، و امکان سرمایه‌گذاری با هر مبلغ، ۲۴ ساعته، با شفافیت کامل Ledger.

---

## بخش ۳ — Product Scope

### In Scope (نسخه ۱)
- لندینگ + وبلاگ + صفحات فرود
- احراز هویت سه‌سطحی + OTP + 2FA
- خرید/فروش طلا (نقدی)
- خرید قسطی (دو مدل)
- سوددهی روی طلا
- کیف پول ریالی + طلا + انتقال داخلی
- تحویل فیزیکی (درخواست + مدیریت ادمین)
- تیکت و پشتیبانی + چت real-time
- دعوت از دوستان + کمیسیون
- نوتیفیکیشن چندکاناله
- پنل ادمین کامل (RBAC)
- PWA + Android (Capacitor)
- SEO + Analytics

### Out of Scope (نسخه ۱)
- اپ iOS Native (فقط PWA)
- صرافی ارز دیجیتال
- وام ریالی روی طلا (V2)
- کارت بانکی اختصاصی زرنما (V2)
- بازار ثانویه طلا (V2)
- API عمومی برای توسعه‌دهندگان (V2)

### Future Expansion
- وام ریالی با پشتوانه طلا
- کارت بانکی متصل به کیف پول
- بازار ثانویه معاملات OTC
- صندوق‌های سرمایه‌گذاری طلا
- API عمومی
- اپ iOS Native
- هوش مصنوعی پیشنهاد سرمایه‌گذاری

---

## بخش ۴ — Business Model

### جریان‌های درآمدی
1. **Spread خرید/فروش**: تفاوت قیمت خرید و فروش (قابل تنظیم ادمین، پیش‌فرض ۰.۵٪)
2. **کارمزد معامله**: درصد از مبلغ معامله (پیش‌فرض ۰.۵٪، قابل تنظیم)
3. **کارمزد قسطی**: درصد از مبلغ طرح + کارمزد چک
4. **کارمزد تحویل فیزیکی**: کارمزد ساخت شمش + ارسال
5. **کارمزد برداشت**: درصد از مبلغ برداشت (پیش‌فرض ۰٪ تا سقف)
6. **سود از طلای قفل‌شده**: پلتفرم از طلای قفل‌شده در طرح‌های سوددهی استفاده می‌کند و سود خالص را به کاربر می‌دهد

### BUSINESS DECISION REQUIRED
- نرخ دقیق Spread و کارمزدها
- سقف برداشت روزانه/ماهانه
- حداقل موجودی برای تحویل فیزیکی
- نرخ سوددهی طرح‌ها (نیازمند تایید حقوقی)
- مدل کمیسیون دعوت (تک‌سطحی/چندسطحی)
- آیا سوددهی ریالی هم ارائه شود؟ (مقررات ربوی)

---

## بخش ۵ — User Personas

### P1: پس‌اندازکننده عادی
- ۲۵-۴۵ سال، درآمد متوسط
- هدف: حفظ ارزش پول در برابر تورم
- نیاز: سادگی، اعتماد، مبالغ کوچک

### P2: سرمایه‌گذار حرفه‌ای
- ۳۰-۵۵ سال، درآمد بالا
- هدف: سودآوری از نوسان طلا + سوددهی
- نیاز: نمودار، گزارش، حجم بالا، سرعت

### P3: خریدار قسطی
- ۲۰-۴۰ سال، درآمد متوسط، دسترسی به چک
- هدف: خرید طلا با پرداخت اقساطی
- نیاز: طرح‌های منعطف، شفافیت اقساط

### P4: دعوت‌کننده
- فعال در شبکه‌های اجتماعی
- هدف: کسب درآمد از دعوت
- نیاز: لینک دعوت، آمار، گزارش کمیسیون

### P5: ادمین پلتفرم
- کارمند زرنما
- هدف: مدیریت کاربران، معاملات، محتوا
- نیاز: پنل کامل، RBAC، گزارش

---

## بخش ۶ — User Journeys

### J1: ورود تا خرید طلا
1. ورود به لندینگ → کلیک «ثبت‌نام»
2. وارد کردن موبایل → دریافت OTP → تایید
3. تنظیم رمز → حساب ایجاد (سطح KYC 1)
4. ورود به داشبورد → کلیک «خرید طلا»
5. وارد کردن مبلغ/گرم → پیش‌نمایش (کارمزد، spread)
6. تایید → کسر از کیف پول ریالی (یا درخواست شارژ)
7. ثبت معامله → اضافه شدن طلا به Ledger
8. فاکتور PDF + نوتیفیکیشن

### J2: فروش طلا
1. داشبورد → «فروش طلا»
2. انتخاب مقدار طلا → پیش‌نمایش
3. تایید → کسر طلا، اضافه شدن ریال به کیف پول
4. درخواست برداشت به حساب بانکی (یا نگه‌داری)

### J3: احراز هویت
1. پروفایل → «تکمیل احراز هویت»
2. سطح 2: اطلاعات هویتی + تصویر کارت ملی
3. ارسال برای بررسی → ادمین تایید می‌کند
4. سطح 3: سلفی با کارت ملی + ویدیو کوتاه
5. ارسال → ادمین تایید → سطح 3 فعال
6. محدودیت‌ها برداشته می‌شود

### J4: خرید قسطی
1. داشبورد → «خرید قسطی»
2. انتخاب طرح (۱۲/۱۸/۲۴ ماه) → محاسبه اقساط
3. انتخاب روش: اعتبارسنجی داخلی یا چک صیادی
4. اگر چک: ثبت شماره صیادی + معرفی ضامن + تایید OTP ضامن
5. ارسال درخواست → صف بررسی ادمین
6. تایید → قرارداد تولید → طلا به کیف پول اضافه می‌شود (قفل‌شده)
7. یادآوری سررسید → پرداخت قسط

### J5: سوددهی
1. داشبورد → «طرح‌های سوددهی»
2. انتخاب طرح (ماهانه/فصلی/سالانه) + مقدار طلا
3. قفل طلا → شروع طرح
4. محاسبه سود روزشمار → پرداخت ماهانه به صورت طلا
5. پایان طرح → بازگشت طلا + سود به موجودی آزاد

### J6: دعوت دوستان
1. داشبورد → «دعوت دوستان» → کد/لینک دعوت
2. اشتراک‌گذاری → دوست ثبت‌نام می‌کند با کد
3. دوست KYC + اولین معامله → دعوت «فعال» می‌شود
4. پرداخت پاداش به دعوت‌کننده (طلا یا ریال)

---

## بخش ۷ — Functional Requirements

### FR-1 احراز هویت
- FR-1.1 ثبت‌نام با موبایل + OTP
- FR-1.2 ورود با موبایل + رمز + OTP
- FR-1.3 تغییر رمز، فراموشی رمز
- FR-1.4 2FA اختیاری (TOTP)
- FR-1.5 مدیریت نشست‌های فعال
- FR-1.6 KYC سه‌سطحی

### FR-2 معاملات
- FR-2.1 خرید طلا (مبلغ/گرم)
- FR-2.2 فروش طلا (مبلغ/گرم)
- FR-2.3 lock قیمت ۶۰ ثانیه
- FR-2.4 پیش‌نمایش سفارش
- FR-2.5 تایید با OTP برای معاملات بزرگ
- FR-2.6 لغو در شرایط مجاز
- FR-2.7 فاکتور PDF
- FR-2.8 تاریخچه + فیلتر

### FR-3 کیف پول
- FR-3.1 شارژ از درگاه بانکی
- FR-3.2 برداشت به حساب بانکی
- FR-3.3 انتقال طلا بین کاربران
- FR-3.4 تحویل فیزیکی
- FR-3.5 تاریخچه تراکنش‌ها
- FR-3.6 اکسپورت

### FR-4 قسطی
- FR-4.1 انتخاب طرح
- FR-4.2 اعتبارسنجی داخلی یا چک
- FR-4.3 ضامن
- FR-4.4 جدول اقساط
- FR-4.5 پرداخت قسط
- FR-4.6 جریمه دیرکرد
- FR-4.7 مدیریت نکول

### FR-5 سوددهی
- FR-5.1 انتخاب طرح
- FR-5.2 قفل طلا
- FR-5.3 محاسبه سود روزشمار
- FR-5.4 پرداخت سود (طلا)
- FR-5.5 پایان/تمدید/زودکرد

### FR-6 تیکت
- FR-6.1 ساخت تیکت + دسته + اولویت
- FR-6.2 چت real-time + پیوست
- FR-6.3 تخصیص به اپراتور
- FR-6.4 SLA + رضایت‌سنجی

### FR-7 دعوت
- FR-7.1 کد/لینک دعوت
- FR-7.2 tracking + attribution
- FR-7.3 پاداش + شرط فعال‌سازی
- FR-7.4 گزارش + آمار

### FR-8 نوتیفیکیشن
- FR-8.1 Push (Web/FCM/APNs)
- FR-8.2 SMS + ایمیل + درون‌اپ
- FR-8.3 تنظیمات per type
- FR-8.4 صف + retry

### FR-9 پنل ادمین
- FR-9.1 RBAC (۹ نقش)
- FR-9.2 مدیریت کاربران، KYC، معاملات
- FR-9.3 مدیریت قیمت، کارمزد، طرح‌ها
- FR-9.4 گزارش‌ها + داشبورد
- FR-9.5 CMS + بنر + وبلاگ
- FR-9.6 Feature Flags

---

## بخش ۸ — Non-Functional Requirements

| دسته | الزام |
|---|---|
| Performance | LCP < 2.5s, FID < 100ms, CLS < 0.1, API p95 < 300ms |
| Scale | ۱۰۰k کاربر، ۱۰k concurrent، ۱M معامله/ماه |
| Availability | 99.9% (نسخه ۱) |
| Security | OWASP Top 10، PCI-DSS برای درگاه، رمزنگاری AES-256 |
| Accessibility | WCAG 2.1 AA |
| Browser | Chrome, Safari, Firefox, Edge (۲ نسخه اخیر) |
| Mobile | Android 8+, iOS 14+ (PWA) |
| i18n | فارسی RTL (نسخه ۱)، آماده انگلیسی |
| Audit | تمام عملیات مالی قابل حسابرسی |

---

## بخش ۹ — UX Architecture

### Information Architecture
```
زرنما
├── لندینگ (عمومی)
│   ├── هیرو، امکانات، قیمت، ماشین حساب، FAQ، وبلاگ، تماس
├── احراز هویت
│   ├── ورود، ثبت‌نام، فراموشی رمز، OTP
├── پنل کاربری (نیازمند لاگین)
│   ├── داشبورد، دارایی، معاملات، کیف پول، قسطی، سوددهی
│   ├── تیکت، دعوت، اعلان‌ها، پروفایل، امنیت، تنظیمات
├── پنل ادمین (نیازمند نقش ادمین)
│   ├── داشبورد، کاربران، KYC، معاملات، مالی، محتوا، تنظیمات
```

### Navigation Patterns
- **دسکتاپ**: Top nav (لندینگ) + Sidebar (پنل)
- **موبایل**: Bottom navigation (پنل) + Hamburger (لندینگ)
- **اپ موبایل**: Bottom nav ثابت + swipe بین تب‌ها

---

## بخش ۱۰ — UI Design System

### رنگ‌ها
```css
--navy: #1a2a4f        /* پس‌زمینه اصلی، هدر */
--navy-dark: #0f1a33   /* پس‌زمینه تیره */
--navy-light: #2a3f6b  /* هاور */
--gold: #c9a227        /* CTA، اکسنت، قیمت */
--gold-light: #e0c25a  /* هاور طلایی */
--gold-dark: #a0801c   /* فعال */
--cream: #f5ecd7       /* پس‌زمینه روشن */
--cream-dark: #e8d9b0  /* مرز */
--success: #2e7d32
--error: #c62828
--warning: #ed6c02
--info: #0288d1
```

### Typography
- فونت: **Vazirmatn** (next/font)
- مقیاس: 12, 14, 16, 18, 20, 24, 30, 36, 48, 64px
- وزن: 400 (بدنه), 500 (medium), 700 (bold), 900 (display)

### Spacing/Radius/Shadow
- Spacing: 4px base (4, 8, 12, 16, 24, 32, 48, 64)
- Radius: 6 (small), 10 (medium), 16 (large), 24 (xl), full
- Shadow: 3 سطح (sm, md, lg) + glow gold برای CTA

### کامپوننت‌ها (shadcn/ui + custom)
Button, Input, Select, Textarea, Checkbox, Radio, Switch, Slider, Modal, Drawer, Sheet, Tabs, Accordion, Table, Card, Badge, Avatar, Tooltip, Toast (sonner), Dialog, Alert, Skeleton, Charts (recharts), Calendar, DatePicker, OTPInput, Stepper, Carousel (swiper), Command (cmdk), BottomNav, Sidebar, DataTable

### States
- Empty, Loading (skeleton), Error (retry), Success, Pending, Locked, Disabled

---

## بخش ۱۱ — Technical Architecture

### Diagram (متن)
```
┌─────────────────────────────────────────┐
│  Clients                                │
│  Web (Next.js) | PWA | Android (Cap)    │
└───────────────┬─────────────────────────┘
                │ HTTPS + WebSocket
┌───────────────▼─────────────────────────┐
│  Next.js 15 (App Router)                │
│  ├─ app/ (SSR/SSG/ISR)                  │
│  ├─ api/ (Route Handlers)                │
│  ├─ Socket.io server                    │
│  └─ middleware (auth, rate-limit)       │
└───────┬───────────────┬─────────────────┘
        │               │
┌───────▼───────┐  ┌────▼─────┐  ┌──────────┐
│ PostgreSQL    │  │ Redis    │  │ Object   │
│ (Prisma)      │  │ (cache,  │  │ Storage  │
│               │  │ queue,   │  │ (S3/MinIO)│
│               │  │ pubsub)  │  │          │
└───────────────┘  └──────────┘  └──────────┘
        │               │
        │          ┌────▼─────┐
        │          │ BullMQ   │ (workers: notification, price, reconciliation)
        │          └──────────┘
        │
┌───────▼───────────────────┐
│ External Services         │
│ Price API, SMS, Payment   │
│ Gateway, Push (FCM/APNs)  │
└───────────────────────────┘
```

### WHY THIS TECHNOLOGY?

| تکنولوژی | چرا؟ | چرا نه جایگزین؟ |
|---|---|---|
| Next.js 15 | SSR/SSG/ISR + API در یک پروژه، PWA عالی، Capacitor-ready، ecosystem قوی | Remix: ecosystem کوچک‌تر؛ CRA: deprecate |
| TypeScript | type safety، refactoring، self-documenting | JS خالص: ریسک در FinTech |
| Tailwind v4 | سرعت، consistency، bundle کوچک | CSS خالص: کند در پروژه بزرگ |
| shadcn/ui | قابل customize، ownership کامل، Radix-based | MUI: سنگین، کم‌انعطاف |
| Prisma | type-safe، migration، ecosystem | Drizzle: کم‌مستندتر؛ TypeORM: سنگین |
| PostgreSQL | ACID، JSONB، Ledger مناسب، مقیاس | MongoDB: ACID ضعیف برای مالی |
| Redis | کش + صف + pubsub در یک ابزار | Memcached: بدون صف |
| BullMQ | صف شغل‌های قابل اعتماد | cron خالص: بدون retry |
| Socket.io | real-time با fallback، room برای تیکت | SSE: یک‌طرفه؛ Polling: ناکارآمد |
| Capacitor | وب‌تکنالوژی → اپ native، آشنا | React Native: کد جدا، پل پل |
| Zustand | سبک، ساده | Redux: boilerplate زیاد |
| TanStack Query | cache، retry، invalidation | SWR: کم‌امکان‌تر |
| Zod | validation runtime + type inference | Yup: کم‌قدرتمندتر |

---

## بخش ۱۲ — Database Architecture

### Entities اصلی (Prisma models)

#### User
- id (UUID, PK), mobile (unique), passwordHash, pepper
- kycLevel (enum: 0,1,2,3), status (active/blocked/deleted)
- referralCode (unique), referredById (FK self)
- creditScore (int), createdAt, updatedAt

#### KycSubmission
- id, userId (FK), level (1,2,3), status (pending/approved/rejected)
- nationalCode, birthDate, firstName, lastName
- idCardImageUrl, selfieImageUrl, videoUrl
- rejectionReason, reviewedBy (FK Admin), reviewedAt
- createdAt (immutable)

#### Session
- id, userId (FK), refreshTokenHash, deviceInfo, ip, userAgent
- expiresAt, revokedAt, createdAt

#### OtpCode
- id, mobile, code (hash), purpose (login/register/reset/confirm)
- attempts, expiresAt, consumedAt, createdAt

#### GoldPrice
- id, buyPrice, sellPrice, source (api/manual), rawPrice
- spread, recordedAt (indexed, immutable)

#### Wallet (یک به یک با User)
- id, userId (unique FK), goldBalanceGram (decimal 18,8)
- rialBalance (bigint), lockedGold, lockedRial

#### LedgerEntry (immutable, append-only)
- id, walletId (FK), type (gold_buy/gold_sell/deposit/withdraw/transfer_in/transfer_out/interest/lock/unlock/installment)
- amountGold (decimal, signed), amountRial (bigint, signed)
- balanceAfterGold, balanceAfterRial
- referenceType, referenceId (polymorphic)
- createdAt (immutable)

#### Order
- id, userId (FK), type (buy/sell), goldAmount, rialAmount
- unitPrice, spread, fee, total, status (pending/locked/filled/cancelled/failed)
- priceLockExpiresAt, otpConfirmed, createdAt

#### Transaction (ریالی)
- id, walletId (FK), type (deposit/withdraw/fee/transfer)
- amount (signed), status (pending/completed/failed/reversed)
- gatewayRef, bankRef, createdAt

#### WithdrawalRequest
- id, userId (FK), amount, iban, status (pending/approved/rejected/paid/failed)
- processedBy (FK Admin), processedAt

#### InstallmentPlan
- id, name, months (12/18/24), downPaymentPercent, interestRate, fee
- minAmount, maxAmount, active (bool)

#### InstallmentContract
- id, userId (FK), planId (FK), principal, downPayment, totalPayable
- method (internal_credit/cheque), status (pending/active/completed/defaulted)
- chequeNumber, chequeImage, guarantorId (FK User), guarantorApprovedAt
- approvedBy (FK Admin), approvedAt, createdAt

#### InstallmentPayment
- id, contractId (FK), installmentNumber, dueDate, amount
- status (pending/paid/overdue/defaulted), paidAt, lateFee

#### InvestmentPlan
- id, name, durationDays, minGoldGram, interestRateType (fixed/variable)
- rate, active

#### InvestmentPosition
- id, userId (FK), planId (FK), goldAmount, startDate, endDate
- status (active/matured/early_closed), closedAt, createdAt

#### InterestPayout
- id, positionId (FK), amountGold, periodStart, periodEnd, paidAt

#### Ticket
- id, userId (FK), subject, category, priority, status (open/in_progress/answered/closed)
- assignedTo (FK Admin), department, slaDeadline, closedAt

#### TicketMessage
- id, ticketId (FK), senderType (user/admin), senderId, body, attachments (json)
- createdAt (immutable)

#### Referral
- id, referrerId (FK User), referredId (FK User, unique), status (pending/qualified/rewarded)
- qualifiedAt, rewardAmount, rewardType, createdAt

#### Notification
- id, userId (FK), type, title, body, data (json), channel (push/sms/email/inapp)
- status (queued/sent/delivered/failed/read), sentAt, readAt

#### NotificationTemplate
- id, key (unique), channels, titleTemplate, bodyTemplate, variables (json)

#### AuditLog (immutable)
- id, actorType (user/admin/system), actorId, action, entityType, entityId
- before (json), after (json), ip, userAgent, createdAt

#### AdminUser
- id, userId (FK), role (enum), permissions (json), active

#### CmsContent
- id, key (unique), type (banner/faq/blog/page), title, body, slug, status, publishedAt

#### FeatureFlag
- id, key (unique), enabled, rolloutPercent, description

### اصول طراحی
- **Immutable**: LedgerEntry, AuditLog, TicketMessage, GoldPrice, KycSubmission
- **Double-Spending Prevention**: هر معامله در یک transaction DB انجام می‌شود با `SELECT ... FOR UPDATE` روی Wallet، به‌علاوه lock توزیع‌شده Redis برای idempotency
- **Idempotency**: هر درخواست مالی `Idempotency-Key` دارد؛ در Redis ذخیره می‌شود
- **Reconciliation**: cron روزانه جمع Ledger را با Wallet.balance مقایسه می‌کند
- **Decimal**: تمام مبالغ طلا `Decimal(18,8)`، ریالی `BigInt` (ریال بزرگ‌تر از int)
- **Soft Delete**: User با status=deleted، نه حذف فیزیکی (audit)

### Indexes
- LedgerEntry: (walletId, createdAt), (referenceType, referenceId)
- Order: (userId, createdAt), (status)
- GoldPrice: (recordedAt desc)
- AuditLog: (actorId, createdAt), (entityType, entityId)
- Ticket: (userId, status), (assignedTo, status)

---

## بخش ۱۳ — API Architecture

### Conventions
- Base: `/api/v1`
- Auth: Bearer JWT (access) در هدر Authorization
- Response envelope: `{ success: bool, data?, error?, meta? }`
- Pagination: `?page=1&limit=20` → `meta: { page, limit, total, totalPages }`
- Errors: RFC 7807 Problem Details
- Idempotency: `Idempotency-Key` header برای POST مالی
- Rate limit: `X-RateLimit-*` headers
- Versioning: URL-based

### Domain Endpoints (خلاصه)

#### Auth
- `POST /auth/register` (mobile + password)
- `POST /auth/otp/send` (mobile, purpose)
- `POST /auth/otp/verify` (mobile, code, purpose)
- `POST /auth/login` (mobile, password, otp?)
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/2fa/enable`
- `POST /auth/2fa/verify`
- `GET /auth/sessions` / `DELETE /auth/sessions/:id`

#### KYC
- `GET /kyc`, `POST /kyc/submit-level2`, `POST /kyc/submit-level3`
- `GET /kyc/status`

#### Price
- `GET /price/current`, `GET /price/history?range=...`

#### Wallet
- `GET /wallet`, `GET /wallet/ledger?type=...&page=...`
- `POST /wallet/deposit` (initiate gateway)
- `POST /wallet/deposit/verify`
- `POST /wallet/withdraw` (iban, amount)
- `POST /wallet/transfer` (toUserId, goldAmount)

#### Order
- `POST /orders/preview` (type, amount)
- `POST /orders` (with Idempotency-Key)
- `GET /orders`, `GET /orders/:id`
- `POST /orders/:id/cancel`

#### Installment
- `GET /installments/plans`
- `POST /installments/apply` (planId, method, ...)
- `GET /installments/contracts`, `GET /installments/contracts/:id`
- `POST /installments/contracts/:id/pay` (installmentId)
- `POST /installments/contracts/:id/cheque`

#### Investment
- `GET /investments/plans`
- `POST /investments/positions` (planId, goldAmount)
- `GET /investments/positions`, `GET /investments/positions/:id`
- `POST /investments/positions/:id/close`
- `GET /investments/positions/:id/payouts`

#### Referral
- `GET /referral/code`, `GET /referral/stats`, `GET /referral/list`

#### Ticket
- `GET /tickets`, `POST /tickets`, `GET /tickets/:id`
- `POST /tickets/:id/messages` (with attachments)
- `POST /tickets/:id/close`, `POST /tickets/:id/rate`

#### Notification
- `GET /notifications`, `POST /notifications/read/:id`, `POST /notifications/read-all`
- `GET /notifications/preferences`, `PUT /notifications/preferences`
- `POST /notifications/push/subscribe` (VAPID endpoint)

#### Admin (پیشوند `/api/v1/admin`)
- `GET /admin/users`, `GET /admin/users/:id`, `PATCH /admin/users/:id`
- `POST /admin/users/:id/block`, `POST /admin/users/:id/kyc/approve`
- `GET /admin/orders`, `GET /admin/withdrawals`, `POST /admin/withdrawals/:id/approve`
- `GET /admin/installments`, `POST /admin/installments/:id/approve`
- `CRUD /admin/plans` (installment + investment)
- `CRUD /admin/pricing` (spread, fee, manual price)
- `CRUD /admin/cms`, `CRUD /admin/banners`
- `GET /admin/reports/...`
- `CRUD /admin/feature-flags`
- `GET /admin/audit-logs`

### WebSocket Events (Socket.io)
- `price:update` (broadcast به همه)
- `ticket:message` (room: `ticket:{id}`)
- `notification` (room: `user:{id}`)
- `order:status` (room: `user:{id}`)

---

## بخش ۱۴ — Security Architecture

### Authentication & Authorization
- JWT access (۱۵ دقیقه) + refresh (۳۰ روز) در httpOnly + Secure + SameSite=Lax cookie
- Refresh rotation + reuse detection
- RBAC با ۹ نقش ادمین + permission granular
- 2FA اختیاری (TOTP با otpauth)

### OTP
- ۶ رقم، TTL ۲ دقیقه، max ۵ تلاش، فاصله ۶۰ ثانیه بین ارسال
- hash با bcrypt + pepper
- rate limit با Redis (slide window)

### Rate Limiting
- عمومی: ۱۰۰ req/min per IP
- OTP: ۵/ساعت per mobile
- Login: ۱۰/ساعت per mobile
- API مالی: ۳۰/min per user
- ادمین: ۲۰۰/min per admin

### Protect Against
- **Brute Force**: قفل اکانت پس ۵ تلاش ناموفق (۱۵ دقیقه)
- **CSRF**: double-submit cookie + SameSite
- **XSS**: sanitization + CSP strict + Trusted Types
- **SQLi**: Prisma parameterized (هیچ raw query بدون escape)
- **SSRF**: allowlist دامنه برای fetch سرور
- **File Upload**: MIME check + magic bytes + clamav scan + rename + sandbox path
- **IDOR**: authorization check در هر endpoint با owner_id

### Encryption
- در حال استراحت: AES-256-GCM برای شماره کارت، IBAN، فایل‌های KYC
- در انتقال: TLS 1.3
- رمز: bcrypt (cost 12) + pepper
- Secrets: env vars + Vault در production

### Transaction Security
- OTP برای معاملات > ۱۰ مبنای قابل تنظیم
- OTP برای برداشت
- IP whitelist برای ادمین (optional)
- تشخیص login از IP جدید (هشدار)
- Device fingerprinting

### Fraud / Risk Engine
- امتیاز ریسک per user (مبتنی بر سابقه، سرعت معامله، IP)
- توقف خودکار معامله مشکوک → review ادمین
- محدودیت روزانه پویا

### Audit
- تمام عملیات حساس → AuditLog (immutable)
- لاگ ورود، معامله، برداشت، تغییر KYC، تغییر تنظیمات

### Backup & DR
- پشتیبان روزانه PostgreSQL (رمزنگاری) + WAL streaming
- RPO ۱ ساعت، RTO ۴ ساعت
- تست بازیابی فصلی

### DECISION REQUIRED
- آیا نیاز به Pen-test شخص ثالث قبل از لانچ؟ (توصیه: بله)
- استاندارد PCI-DSS یا فقط PCI-DSS SAQ-A (درگاه redirect)?

---

## بخش ۱۵ — KYC Architecture

### سطوح
- **سطح ۱**: تایید موبایل (در ثبت‌نام) → خرید تا سقف روزانه پایه
- **سطح ۲**: اطلاعات هویتی + تصویر کارت ملی → افزایش سقف
- **سطح ۳**: سلفی با کارت ملی + ویدیو کوتاه → سقف کامل + برداشت + تحویل فیزیکی

### جریان
1. کاربر فرم سطح ۲ را پر می‌کند → POST /kyc/submit-level2
2. OCR پایه (tesseract.js) استخراج اطلاعات → مقایسه با ورودی
3. status = pending → صف ادمین
4. ادمین بررسی → approve/reject (با دلیل)
5. اگر reject → کاربر می‌تواند resubmit
6. سطح ۳: سلفی + ویدیو → face match پایه (face-api.js)
7. ادمین تایید نهایی

### محدودیت‌ها (قابل تنظیم ادمین)
| سطح | سقف خرید روزانه | برداشت | تحویل فیزیکی | قسطی |
|---|---|---|---|---|
| ۱ | ۵ مبنای طلا | خیر | خیر | خیر |
| ۲ | ۵۰ مبنای طلا | تا ۵۰ مبنای ریال | خیر | تا ۵۰ مبنای |
| ۳ | نامحدود (با review) | کامل | بله | کامل |

### Audit
- هر تغییر status در KycSubmission + AuditLog

---

## بخش ۱۶ — Trading Architecture

### Pricing Engine
- cron هر ۶۰ ثانیه: fetch از API خارجی → ذخیره GoldPrice → emit Socket.io
- fallback: آخرین قیمت معتبر در صورت قطعی API
- ادمین می‌تواند override دستی (با audit)

### Order Flow
1. کاربر درخواست preview → backend قیمت لحظه‌ای + spread + fee را محاسبه
2. lock قیمت به مدت ۶۰ ثانیه (Redis: `price:lock:{userId}`)
3. کاربر تایید → POST /orders با Idempotency-Key
4. backend در یک DB transaction:
   - SELECT FOR UPDATE روی Wallet
   - بررسی موجودی کافی
   - ایجاد LedgerEntry (signed)
   - آپدیت Wallet.balance
   - ایجاد Order (status=filled)
5. اگر مبلغ > threshold → OTP تایید
6. emit notification + Socket.io

### Cancel
- فقط در status=pending (قبل از fill) قابل لغو

---

## بخش ۱۷ — Wallet/Ledger Architecture

### اصل مهم
- **Ledger append-only immutable**: هیچ آپدیت/حذف روی LedgerEntry
- **Wallet.balance** = جمع LedgerEntryهای آن wallet (redundant برای performance، reconciliation روزانه)
- **Double-Spending Prevention**: SELECT FOR UPDATE + Redis lock
- **Idempotency-Key**: در Redis ذخیره، اگر تکراری → همان پاسخ قبلی

### Reconciliation
- cron روزانه: `SUM(LedgerEntry) vs Wallet.balance` → اگر mismatch → alert + freeze

### Transfer داخلی
- در یک transaction: LedgerEntry از A، LedgerEntry به B، آپدیت هر دو Wallet

---

## بخش ۱۸ — Notification Architecture

### Channels
- **Push**: Web (VAPID) + FCM (Android) + APNs (iOS PWA)
- **SMS**: Kavenegar/فراز
- **Email**: SMTP (Postfix/Resend)
- **In-App**: در DB + Socket.io real-time

### Flow
1. Trigger (event) → enqueue در BullMQ `notification`
2. Worker: render template → ارسال به کانال‌های فعال کاربر
3. ذخیره status در Notification
4. retry ۳ بار با backoff در صورت شکست

### Templates (NotificationTemplate)
- OTP, login_alert, deposit_success, withdrawal_pending, withdrawal_paid, buy_success, sell_success, installment_reminder, interest_paid, referral_qualified, ticket_reply, kyc_approved, kyc_rejected, price_alert, security_alert

### Preferences
- کاربر برای هر نوع نوتیفیکیشن می‌تواند کانال‌ها را toggle کند

---

## بخش ۱۹ — Referral Architecture

- کد دعوت: ۸ حرف (base32) auto-generated، unique
- لینک: `https://zarnama.ir/r/{code}` → redirect به لندینگ با cookie referral
- در ثبت‌نام: اگر cookie → referredById ثبت
- شرط فعال‌سازی: referredId سطح KYC ≥ ۲ + اولین معامله ≥ threshold
- پاداش: قابل تنظیم (طلا یا ریال) به دعوت‌کننده (و optionally به referred)
- تک‌سطحی در نسخه ۱ (قابل توسعه به چندسطحی)
- Anti-abuse: یک IP/دستگاه نمی‌تواند دو دعوت فعال کند، max پاداش ماهانه

---

## بخش ۲۰ — Installment Architecture

### Plans (InstallmentPlan)
- months: 12, 18, 24
- downPaymentPercent: 20-50%
- interestRate: قابل تنظیم (BUSINESS DECISION)
- fee: درصد ثابت
- minAmount, maxAmount

### Methods
1. **internal_credit**: بر اساس creditScore کاربر (سابقه معاملات، KYC، عمر حساب)
2. **cheque**: ثبت شماره صیادی + تصویر چک + ضامن (تایید OTP ضامن)

### Contract Flow
1. کاربر انتخاب طرح + روش → POST /installments/apply
2. محاسبه اقساط (annuity formula)
3. اگر cheque: ثبت چک + ضامن
4. status=pending → صف ادمین
5. ادمین approve → Contract active → طلا به Wallet (قفل‌شده تا پایان)
6. سررسید: reminder + پرداخت قسط
7. دیرکرد: جریمه قابل تنظیم
8. نکول: اجرای چک / مسدودسازی / گزارش

### DECISION REQUIRED
- نرخ سود قسطی (مقررات اسلامی؟ سود بدون بهره + کارمزد؟)
- مدل جریمه دیرکرد

---

## بخش ۲۱ — Investment (سوددهی) Architecture

### Plans (InvestmentPlan)
- durationDays: 30, 90, 180, 365
- minGoldGram
- rate: درصد سود سالانه (قابل تنظیم)
- نوع: سود به صورت طلا (تورم‌زدا)

### Position Flow
1. کاربر انتخاب طرح + مقدار طلا → POST /investments/positions
2. lock طلا (Wallet.lockedGold +=, goldBalance -=)
3. cron روزانه: محاسبه سود روزشمار → در پایان ماه InterestPayout (طلا به Wallet)
4. پایان طرح: unlock طلا → status=matured
5. زودکرد: با جریمه قابل تنظیم → status=early_closed
6. تمدید: ایجاد position جدید با همان مقدار

### DECISION REQUIRED
- نرخ سود (نیازمند تایید حقوقی - آیا سود ریالی ربوی محسوب می‌شود؟)
- آیا سود طلا هم مشکل شرعی دارد؟ (مشاوره حقوقی)

---

## بخش ۲۲ — Admin Architecture

### Roles (RBAC)
| Role | دسترسی |
|---|---|
| Super Admin | همه |
| Finance | تراکنش، برداشت، گزارش مالی |
| Support | تیکت، کاربران (read) |
| KYC | بررسی KYC |
| Risk | risk engine، fraud |
| Content | CMS، وبلاگ، بنر |
| Operations | سیستم، feature flags |
| Analyst | گزارش‌ها (read) |
| Read Only | مشاهده |

### Modules
- Overview Dashboard (KPIs)
- Users (CRUD + block + KYC review)
- Orders, Transactions, Withdrawals
- Pricing (spread, fee, manual price)
- Plans (installment + investment)
- Referral
- Support (tickets)
- Notifications (broadcast)
- CMS (blog, FAQ, banners, pages)
- Settings (general, fees, OTP)
- Roles & Permissions
- Audit Logs
- Reports (financial, risk, fraud)
- System Health
- Feature Flags

---

## بخش ۲۳ — Mobile/PWA Architecture

### PWA
- `manifest.webmanifest` (icons, shortcuts, screenshots, display standalone)
- Service Worker (Serwist): precache + runtime cache + offline fallback
- Offline: صف تراکنش در IndexedDB → sync هنگام آنلاین
- Add to Home Screen prompt (custom)
- Splash screen (Android + iOS)

### Capacitor (Android)
- `capacitor.config.ts`
- Plugins: Camera (KYC), Push (FCM), Share, Haptics, App, Network
- Build: `next build && next export` → `npx cap sync` → Android Studio
- Deep links: `zarnama://` + universal links

### iOS PWA
- Push notifications (iOS 16.4+)
- محدودیت‌ها: no background fetch طولانی، storage محدود

### Shared
- Web و Mobile از همان Next.js build (Capacitor از `out/` استفاده می‌کند)
- API یکسان
- Design system یکسان با responsive variants

---

## بخش ۲۴ — SEO Architecture

### Technical
- SSR/SSG برای صفحات عمومی، ISR برای وبلاگ
- `metadata` per page (title, description, OG, Twitter)
- `sitemap.xml` (dynamic) + `robots.txt`
- canonical + hreflang (آماده انگلیسی)
- structured data: Organization, Product, FAQ, BreadcrumbList, Article, WebApplication
- صفحه سرعت: Core Web Vitals سبز

### Content
- لندینگ با H1/H2 سلسله‌مراتبی
- وبلاگ با مقالات SEO-friendly
- صفحات فرود تبلیغاتی per campaign
- Referral landing per referrer (dynamic OG)

---

## بخش ۲۵ — Analytics

### Events
- signup, login, kyc_submit, kyc_approve
- order_preview, order_create, order_cancel
- deposit_initiate, deposit_success, withdraw_request
- installment_apply, installment_pay
- investment_create, investment_close
- referral_share, referral_qualified
- ticket_create, ticket_reply

### Tools
- **PostHog** (self-hosted) برای product analytics + funnel + cohort
- **Sentry** برای error tracking
- **Custom dashboards** در ادمین از داده‌های DB

### Dashboards (Admin)
- Acquisition (signup, KYC conversion)
- Trading (volume, orders, spread revenue)
- Financial (deposit, withdraw, fee revenue)
- Retention (cohort, churn)
- Referral (conversion, ROI)
- Risk (fraud alerts, blocked users)

---

## بخش ۲۶ — Testing Strategy

| نوع | ابزار | پوشش |
|---|---|---|
| Unit | Vitest | توابع، services, validators |
| Integration | Vitest + supertest | API endpoints |
| E2E | Playwright | جریان‌های کلیدی |
| Security | OWASP ZAP, npm audit | اسکن خودکار |
| Load | k6 | ۱۰۰۰ concurrent |
| Performance | Lighthouse CI | Core Web Vitals |
| PWA | Lighthouse PWA + manual | install, offline |
| Responsive | Playwright + BrowserStack | breakpoints |
| Financial | Vitest (property-based) | محاسبات، ledger |
| Concurrency | k6 + custom | race conditions |
| Regression | Vitest snapshot | UI components |

### Test Cases مهم (مالی)
- خرید با موجودی کافی → success
- خرید با موجودی ناکافی → reject، بدون تغییر balance
- خرید هم‌زمان (race) → فقط یکی success
- Idempotency: درخواست تکراری → همان نتیجه
- Reconciliation: SUM(ledger) = balance
- محاسبه کارمزد و spread
- قفل طلا در investment → موجودی آزاد کاهش، locked افزایش
- پرداخت قسط با جریمه دیرکرد

---

## بخش ۲۷ — DevOps / Deployment

### Environments
- **dev**: local (docker-compose)
- **staging**: cloud (تست قبل از prod)
- **production**: cloud

### Stack
- Container: Docker (multi-stage)
- Orchestration: Docker Swarm (نسخه ۱) → Kubernetes (V2)
- CI/CD: GitHub Actions
- Registry: GitHub Container Registry
- Reverse proxy: Caddy (auto TLS)
- Monitoring: Prometheus + Grafana
- Logs: Loki
- Error: Sentry
- Uptime: UptimeRobot + custom health endpoint

### Pipeline
1. push → lint + typecheck + test
2. merge to main → build → push image → deploy staging
3. tag release → deploy production (with rollback)
4. migration: Prisma migrate (staging first)

### Backup
- PostgreSQL: pg_dump روزانه + WAL streaming (point-in-time recovery)
- Redis: RDB هر ساعت
- Object storage: versioning

### Health
- `/api/health` (liveness) + `/api/health/ready` (readiness: DB, Redis)

---

## بخش ۲۸ — Risk Register

| Risk | Prob | Impact | Mitigation | Contingency |
|---|---|---|---|---|
| API قیمت قطع شود | متوسط | بالا | fallback آخرین قیمت + override ادمین | قرارداد با منبع دوم |
| Double-spending bug | کم | بحرانی | DB transaction + Redis lock + reconciliation | freeze سیستم + rollback |
| Data breach | کم | بحرانی | encryption + pentest + RBAC | incident response + notify users |
| Fraud قسطی | متوسط | بالا | risk engine + ضامن + چک صیادی | اجرای چک + مسدودسازی |
| Run on withdrawals | کم | بحرانی | liquidity reserve + daily limit | توقف موقت برداشت |
| PWA iOS محدودیت | متوسط | متوسط | تست + fallback به web | اپ native در V2 |
| Scale bottleneck | متوسط | متوسط | cache + read replica + queue | scale horizontal |
| Regulatory change | متوسط | بالا | مشاور حقوقی + design flexible | pivot model |
| OTP SMS قطع شود | کم | بالا | fallback به voice OTP + email OTP | |
| Ledger corruption | کم | بحرانی | immutable + backup + reconciliation | restore from backup |

---

## بخش ۲۹ — Dependency Graph

```
Phase 0 (setup) ─┬─> Phase 1 (landing)
                 ├─> Phase 2 (auth)
                 │
Phase 2 ─────────┴─> Phase 3 (user panel base)
                       │
Phase 5 (price) ──────┤
Phase 4 (KYC) ────────┼─> Phase 6 (trading) ─> Phase 7 (wallet)
                       │                          │
                       ├─> Phase 8 (installment) ─┤
                       ├─> Phase 9 (investment) ───┤
                       ├─> Phase 10 (assets) ──────┤
                       ├─> Phase 11 (ticket) ──────┤
                       ├─> Phase 12 (referral) ────┤
                       ├─> Phase 13 (notification) ─┤
                       │
Phase 14-16 (admin) ───┘ (parallel بعد از Phase 3)
Phase 17 (security) ─── cross-cutting (همه فازها)
Phase 18 (PWA) ─────── بعد از Phase 1 + 3
Phase 19 (testing) ─── cross-cutting
Phase 20 (devops) ──── بعد از Phase 0
Phase 21 (analytics) ── بعد از Phase 6
```

### Critical Path
Phase 0 → 2 → 3 → 5 → 6 → 7 → MVP

### MVP Definition
- Phase 0, 1, 2, 3, 4, 5, 6, 7, 11 (ticket), 13 (notification), 14-16 (admin), 17 (security), 18 (PWA), 20 (devops)
- یعنی: لندینگ + احراز هویت + KYC + قیمت + خرید/فروش + کیف پول + تیکت + نوتیفیکیشن + پنل ادمین + امنیت + PWA + استقرار

### V1.5 (پس از MVP)
- Phase 8 (installment), 9 (investment), 10 (assets), 12 (referral)

### V2
- Phase 19 (testing کامل), 21 (analytics), + features آینده

---

## بخش ۳۰ — Project Structure

```
zarnama/
├── src/
│   ├── app/
│   │   ├── (landing)/            # لندینگ پیج
│   │   ├── (auth)/               # ورود/ثبت‌نام/OTP
│   │   ├── (dashboard)/          # پنل کاربری
│   │   ├── (admin)/              # پنل ادمین
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth/
│   │   │       ├── kyc/
│   │   │       ├── price/
│   │   │       ├── wallet/
│   │   │       ├── orders/
│   │   │       ├── installments/
│   │   │       ├── investments/
│   │   │       ├── referrals/
│   │   │       ├── tickets/
│   │   │       ├── notifications/
│   │   │       └── admin/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── manifest.webmanifest
│   │   ├── sw.ts                  # service worker (Serwist)
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── ui/                    # shadcn
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── shared/
│   │   └── providers/
│   ├── lib/
│   │   ├── auth/                  # jwt, otp, session
│   │   ├── db/                    # prisma client
│   │   ├── redis/
│   │   ├── queue/                 # bullmq
│   │   ├── services/              # business logic (domain)
│   │   │   ├── auth.service.ts
│   │   │   ├── kyc.service.ts
│   │   │   ├── price.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── installment.service.ts
│   │   │   ├── investment.service.ts
│   │   │   ├── referral.service.ts
│   │   │   ├── ticket.service.ts
│   │   │   └── notification.service.ts
│   │   ├── validators/            # zod schemas
│   │   ├── utils/
│   │   └── constants/
│   ├── hooks/
│   ├── stores/                    # zustand
│   ├── types/
│   ├── middleware.ts
│   └── instrumentation.ts        # Sentry, analytics
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   ├── images/
│   └── og/
├── capacitor/
│   └── android/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   ├── RUNBOOK.md
│   └── INCIDENT_RESPONSE.md
├── .github/workflows/
├── docker-compose.yml
├── Dockerfile
├── capacitor.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

---

## بخش ۳۱ — Documentation Structure

- `README.md` — شروع سریع، نصب، اجرا
- `docs/ARCHITECTURE.md` — معماری کامل
- `docs/API.md` — مستندات API (OpenAPI)
- `docs/DATABASE.md` — schema + ERD
- `docs/SECURITY.md` — مدل امنیتی
- `docs/DEPLOYMENT.md` — استقرار
- `docs/TESTING.md` — استراتژی تست
- `docs/PRODUCT.md` — PRD
- `docs/ADMIN.md` — راهنمای ادمین
- `docs/MOBILE.md` — build موبایل
- `docs/PWA.md` — راهنمای PWA
- `docs/RUNBOOK.md` — عملیات روزانه
- `docs/INCIDENT_RESPONSE.md` — پاسخ به حادثه
- `MEGAPLAN.md` — همین سند

---

## بخش ۳۲ — Definition of Done

هر Feature زمانی Done است که:
- [ ] کدنویسی شده و review شده
- [ ] Unit + integration test نوشته و pass
- [ ] E2E برای جریان کلیدی pass
- [ ] Responsive در ۳ breakpoint تست شده
- [ ] Loading state + skeleton پیاده شده
- [ ] Error state + retry پیاده شده
- [ ] Empty state طراحی شده
- [ ] Accessibility (WCAG AA) رعایت شده
- [ ] Security review شده (authz, input validation)
- [ ] Audit log برای عملیات حساس
- [ ] Documentation به‌روز شده
- [ ] Lighthouse score > ۹۰
- [ ] لاگ‌گذاری مناسب (سطح info/warn/error)
- [ ] Acceptance Criteria همه pass
- [ ] در staging تست شده

---

## بخش ۳۳ — Execution Phases (۲۵ فاز)

### Phase 0: Setup & Infrastructure
1. نصب Node 20+, pnpm, Docker
2. `pnpm create next-app` با TypeScript + Tailwind + App Router
3. نصب وابستگی‌ها (prisma, ioredis, bullmq, socket.io, zod, jose, bcryptjs, shadcn, zustand, tanstack-query, recharts, sonner, lucide)
4. تنظیم ESLint + Prettier + Husky + lint-staged
5. ساخت ساختار پوشه‌ها (طبق بخش ۳۰)
6. تنظیم Tailwind v4 با پالت navy/gold/cream + تم تیره
7. نصب Vazirmatn با next/font + RTL در layout
8. `prisma init` + schema پایه (User, Session, OtpCode)
9. `docker-compose.yml` (PostgreSQL + Redis)
10. نصب Capacitor + `cap init`
11. تنظیم PWA: manifest + Serwist service worker
12. `.env.example` + `README.md` اولیه
- **Acceptance**: `pnpm dev` اجرا شود، `pnpm lint` pass، docker up، `npx cap` کار کند

### Phase 1: Landing Page
1. `(landing)` route group + layout
2. Header با ناوبری + دکمه ورود/ثبت‌نام (responsive)
3. Hero با شعار + CTA + تصویر پریمیوم
4. Features (۶ کارت: خرید، فروش، قسطی، سوددهی، تحویل فیزیکی، انتقال)
5. WhyZarNama (مزایا با آیکون)
6. PriceWidget (fetch `/api/price` + polling ۶۰s)
7. GoldCalculator (مبلغ ↔ گرم با قیمت لحظه‌ای)
8. Stats (کاربران، حجم، شفافیت)
9. Testimonials (Swiper carousel)
10. FAQ (accordion)
11. TrustBadges (مجوزها)
12. Footer + DownloadApp (QR + لینک PWA)
13. metadata + OG + sitemap + robots
- **Acceptance**: لندینگ کامل، responsive، Lighthouse > ۹۰

### Phase 2: Auth & OTP
1. صفحه ورود (موبایل + OTP)
2. سرویس OTP (Kavenegar) + rate limit Redis
3. صفحه ثبت‌نام (موبایل + رمز + OTP)
4. JWT access+refresh در httpOnly cookie
5. middleware محافظت `/dashboard` و `/admin`
6. فراموشی رمز (OTP + reset)
7. تغییر رمز در پنل
8. 2FA (TOTP) اختیاری
9. refresh rotation + reuse detection
10. bcrypt + pepper
11. لاگ ورود (IP, device)
12. مدیریت نشست‌ها
- **Acceptance**: ثبت‌نام، ورود، logout، refresh، 2FA کار کند

### Phase 3: User Panel Base
1. لایوت پنل (sidebar + header + content) responsive
2. Bottom navigation موبایل
3. داشبورد: موجودی طلا + ریال + ارزش کل
4. نمودار ارزش دارایی (Recharts)
5. منوی کناری RTL با آیکون
6. هدر: آواتار، نام، نوتیفیکیشن، خروج
7. صفحه پروفایل + ویرایش
8. آپلود آواتار (فشرده‌سازی)
9. تنظیمات اعلان‌ها (toggle per type)
10. تنظیمات امنیتی (رمز، 2FA، نشست‌ها)
11. مدیریت نشست‌های فعال (revoke)
12. 404 + error boundary
- **Acceptance**: پنل کار کند، responsive، navigation کامل

### Phase 4: KYC
1. سطح ۱ (تایید موبایل در ثبت‌نام)
2. سطح ۲: فرم اطلاعات + آپلود کارت ملی
3. ذخیره امن فایل (S3/MinIO + encryption)
4. OCR پایه (tesseract.js)
5. سطح ۳: سلفی با کارت ملی (Camera API)
6. سطح ۳: ویدیو کوتاه
7. face match پایه (face-api.js)
8. صفحه وضعیت KYC + تاریخچه
9. پنل ادمین: صف بررسی + approve/reject
10. محدودیت عملیات بر اساس سطح
11. اطلاع‌رسانی نتیجه (push)
12. Audit log تغییرات
- **Acceptance**: ۳ سطح KYC کار کند، ادمین تایید کند

### Phase 5: Pricing Engine
1. سرویس fetch از API خارجی
2. cron هر ۶۰s + ذخیره GoldPrice
3. fallback آخرین قیمت
4. پنل ادمین: override دستی + spread
5. API `/api/price` با کش Redis
6. Socket.io emit `price:update`
7. ویجت قیمت در لندینگ
8. نمودار تاریخچه
9. هشدار قیمت (push)
10. کش Redis TTL کوتاه
11. لاگ تغییرات قیمت
12. گزارش قیمت
- **Acceptance**: قیمت آپدیت لحظه‌ای، نمودار، override ادمین

### Phase 6: Trading (Buy/Sell)
1. صفحه خرید (مبلغ/گرم + preview)
2. محاسبه کارمزد + spread
3. lock قیمت ۶۰s (Redis)
4. POST /orders با Idempotency-Key
5. DB transaction + SELECT FOR UPDATE
6. LedgerEntry + Wallet update
7. صفحه فروش
8. OTP برای معاملات بزرگ
9. تاریخچه + فیلتر
10. فاکتور PDF
11. محدودیت روزانه (KYC)
12. لغو سفارش (pending)
- **Acceptance**: خرید/فروش کار کند، ledger صحیح، race condition تست

### Phase 7: Wallet & Transactions
1. کیف پول ریالی (موجودی)
2. شارژ از درگاه (زرین‌پال)
3. برداشت به IBAN (با تایید ادمین)
4. تاریخچه تراکنش‌ها
5. اکسپورت CSV/Excel
6. انتقال طلا بین کاربران
7. درخواست تحویل فیزیکی
8. مدیریت IBAN کاربر
9. OTP برای برداشت
10. محدودیت برداشت
11. reconciliation با درگاه
12. گزارش تراکنش
- **Acceptance**: شارژ، برداشت، انتقال کار کند

### Phase 8: Installment
1. صفحه طرح‌های قسطی
2. محاسبه اقساط (annuity)
3. روش internal_credit (creditScore)
4. روش cheque (شماره صیادی + تصویر)
5. ضامن + تایید OTP
6. صف بررسی ادمین
7. جدول اقساط + سررسید
8. پرداخت قسط
9. جریمه دیرکرد
10. یادآوری سررسید (push + SMS)
11. گزارش قسط‌ها
12. مدیریت نکول (اجرای چک، مسدودسازی)
- **Acceptance**: هر دو روش کار کند، اقساط محاسبه صحیح

### Phase 9: Investment (سوددهی)
1. صفحه طرح‌های سوددهی
2. نرخ قابل تنظیم ادمین
3. قفل طلا (Ledger lock)
4. محاسبه سود روزشمار (cron)
5. پرداخت سود ماهانه (طلا)
6. تاریخچه سود
7. پایان طرح + unlock
8. تمدید
9. زودکرد با جریمه
10. پنل ادمین: مدیریت طرح‌ها
11. گزارش سوددهی
12. اطلاع‌رسانی پرداخت سود
- **Acceptance**: سود محاسبه و پرداخت صحیح

### Phase 10: Assets & Portfolio
1. صفحه دارایی‌ها (طلا آزاد، قفل، ریال، قسطی، سوددهی)
2. نمودار توزیع (donut)
3. ارزش کل (ریال + گرم طلا)
4. سود/زیان محقق نشده
5. نمودار ارزش در زمان
6. گزارش PDF
7. مقایسه با شاخص طلا
8. پیش‌بینی ارزش
9. اکسپورت
10. اشتراک‌گذاری لینک امن
11. فیلتر زمانی
12. آمار تفصیلی
- **Acceptance**: داشبورد دارایی کامل

### Phase 11: Ticket & Support
1. لیست تیکت‌ها + وضعیت
2. ساخت تیکت (موضوع، دسته، اولویت)
3. چت real-time (Socket.io)
4. آپلود پیوست
5. وضعیت (open/in_progress/answered/closed)
6. پنل ادمین: تخصیص به اپراتور
7. SLA + deadline
8. تاریخچه timeline
9. رضایت‌سنجی
10. پایه دانش (FAQ) + جستجو
11. Canned responses
12. گزارش عملکرد پشتیبانی
- **Acceptance**: تیکت + چت real-time کار کند

### Phase 12: Referral
1. کد دعوت auto-generated
2. لینک دعوت + deep link
3. صفحه دعوت + آمار
4. ثبت دعوت در ثبت‌نام
5. پاداش + شرط فعال‌سازی
6. گزارش دعوت‌ها
7. درخت دعوت (تک‌سطحی)
8. سقف پاداش ماهانه
9. اطلاع‌رسانی دعوت موفق
10. پنل ادمین: مدیریت پاداش
11. Anti-abuse (IP/device)
12. آمار conversion
- **Acceptance**: دعوت + پاداش کار کند

### Phase 13: Notifications
1. مرکز اعلان‌ها (bell + dropdown)
2. Web Push (VAPID)
3. FCM (Android Capacitor)
4. APNs (iOS PWA)
5. تنظیمات per type
6. اعلان قیمت (آستانه کاربر)
7. اعلان تراکنش
8. اعلان تیکت
9. اعلان دعوت
10. اعلان قسط
11. اعلان سود
12. صف + retry (BullMQ)
- **Acceptance**: push در web + Android کار کند

### Phase 14: Admin — Users
1. لیست کاربران (DataTable + صفحه‌بندی)
2. جستجو + فیلتر
3. جزئیات کاربر
4. ویرایش
5. block/unblock
6. تایید/رد KYC
7. تنظیم سطح (VIP)
8. محدودیت‌ها
9. مشاهده تراکنش‌ها
10. افزودن/کسر موجودی دستی (audit)
11. گزارش فعالیت
12. اکسپورت CSV
- **Acceptance**: مدیریت کاربران کامل

### Phase 15: Admin — Orders & Finance
1. لیست معاملات
2. جستجو
3. جزئیات معامله
4. لغو معامله (audit)
5. تنظیم کارمزد سراسری
6. تنظیم spread
7. گزارش روزانه/ماهانه
8. نمودار حجم
9. مدیریت برداشت‌ها (صف)
10. تایید/رد برداشت
11. گزارش مالی (درآمد کارمزد)
12. reconciliation
- **Acceptance**: مدیریت مالی کامل

### Phase 16: Admin — Content & Settings
1. بنرهای لندینگ
2. FAQ CRUD
3. وبلاگ CRUD
4. تنظیمات قیمت (override)
5. تنظیمات کارمزد + spread
6. تنظیمات OTP
7. RBAC (نقش‌ها)
8. Audit log
9. پشتیبان‌گیری
10. تنظیمات عمومی
11. مجوزها + نمادها
12. داشبورد کلی
- **Acceptance**: CMS + تنظیمات کامل

### Phase 17: Security (cross-cutting)
1. rate limiting (middleware + Redis)
2. CORS strict
3. CSRF protection
4. XSS + CSP
5. SQLi prevention (audit Prisma)
6. audit log کامل
7. تشخیص رفتار مشکوک
8. قفل اکانت
9. IP whitelist ادمین
10. رمزنگاری داده حساس
11. backup encryption
12. security headers
- **Acceptance**: OWASP pass، pentest داخلی

### Phase 18: PWA & Mobile
1. manifest کامل
2. service worker (precache + runtime)
3. offline (IndexedDB queue)
4. add to home screen
5. splash screen
6. app icons (Android + iOS)
7. Capacitor plugins (camera, push, share)
8. Android build (APK + AAB)
9. iOS PWA testing
10. native plugins
11. app store assets
12. auto-update SW
- **Acceptance**: نصب روی Android + iOS PWA

### Phase 19: Testing & QA
1. unit tests (Vitest)
2. integration tests
3. E2E (Playwright)
4. security tests (ZAP)
5. load tests (k6)
6. performance (Lighthouse CI)
7. PWA tests
8. responsive tests
9. financial calculation tests
10. ledger reconciliation tests
11. race condition tests
12. regression suite
- **Acceptance**: coverage > ۸۰٪، CI سبز

### Phase 20: DevOps & Deployment
1. Dockerfile multi-stage
2. CI/CD (GitHub Actions)
3. staging
4. production
5. monitoring (Prometheus + Grafana)
6. logs (Loki)
7. backup automation
8. scaling
9. CDN (Cloudflare)
10. SSL auto
11. domain + DNS
12. documentation
- **Acceptance**: deploy خودکار، monitoring فعال

### Phase 21: Analytics
1. PostHog integration
2. event tracking
3. acquisition dashboard
4. trading dashboard
5. financial dashboard
6. retention (cohort)
7. referral dashboard
8. risk dashboard
9. funnel analysis
10. KYC conversion
11. installment performance
12. investment performance
- **Acceptance**: dashboards در ادمین فعال

### Phase 22: SEO
1. metadata per page
2. structured data
3. sitemap dynamic
4. robots
5. canonical
6. OG + Twitter
7. landing pages per campaign
8. blog SEO
9. internal linking
10. performance SEO
11. hreflang (آماده)
12. schema validator
- **Acceptance**: Lighthouse SEO ۱۰۰

### Phase 23: Performance
1. lazy loading
2. code splitting
3. image optimization (next/image)
4. cache strategy
5. DB query optimization
6. bundle analysis
7. PWA caching
8. mobile performance
9. API optimization
10. CDN
11. Core Web Vitals monitoring
12. Lighthouse CI
- **Acceptance**: LCP < 2.5s، CLS < 0.1

### Phase 24: Documentation
1. README
2. ARCHITECTURE.md
3. API.md (OpenAPI)
4. DATABASE.md
5. SECURITY.md
6. DEPLOYMENT.md
7. TESTING.md
8. PRODUCT.md
9. ADMIN.md
10. MOBILE.md + PWA.md
11. RUNBOOK.md
12. INCIDENT_RESPONSE.md
- **Acceptance**: همه docs نوشته شوند

### Phase 25: Final Hardening & Launch
1. pentest داخلی
2. bug bash
3. performance audit
4. security audit
5. accessibility audit
6. backup test
7. DR drill
8. monitoring validation
9. runbook validation
10. soft launch (beta)
11. feedback collection
12. production launch
- **Acceptance**: آماده لانش

---

## بخش ۳۴ — IMPLEMENTATION HANDOFF

**Agent بعدی باید این‌گونه شروع کند:**

1. **مرحله ۱**: فاز ۰ (Setup) را دقیقاً طبق بخش ۳۳ اجرا کن. خروجی: پروژه Next.js با Prisma + Redis + Capacitor + PWA آماده.
2. **مرحله ۲**: فاز ۱ (Landing) را اجرا کن.
3. **مرحله ۳**: فاز ۲ (Auth) را اجرا کن.
4. **مرحله ۴**: به ترتیب Dependency Graph (بخش ۲۹) پیش برو.
5. **قانون**: هیچ تصمیم معماری اصلی را بدون ثبت در MEGAPLAN.md تغییر نده.
6. **قانون**: پس از هر فاز، `MASTER CHECKLIST` (بخش ۳۵) را به‌روز کن.
7. **قانون**: Definition of Done (بخش ۳۲) را برای هر feature رعایت کن.
8. **قانون**: همزمان دسکتاپ و موبایل (responsive + PWA) توسعه بده.
9. **قانون**: پنل ادمین فقط فارسی، لاگ‌ها انگلیسی، کامنت فارسی.

**MVP**: فازهای ۰، ۱، ۲، ۳، ۴، ۵، ۶، ۷، ۱۱، ۱۳، ۱۴، ۱۵، ۱۶، ۱۷، ۱۸، ۲۰

**منتظر دستور `EXECUTE MEGAPLAN` بمان.**

---

## بخش ۳۵ — MASTER CHECKLIST

### Phase 0: Setup
- [ ] 0.1 نصب Node 20+ و pnpm
- [ ] 0.2 ساخت پروژه Next.js 15
- [ ] 0.3 نصب وابستگی‌ها
- [ ] 0.4 ESLint + Prettier + Husky
- [ ] 0.5 ساختار پوشه‌ها
- [ ] 0.6 Tailwind v4 + پالت رنگی
- [ ] 0.7 فونت Vazirmatn + RTL
- [ ] 0.8 Prisma + schema پایه
- [ ] 0.9 docker-compose (PostgreSQL + Redis)
- [ ] 0.10 Capacitor init
- [ ] 0.11 PWA manifest + service worker
- [ ] 0.12 .env.example + README

### Phase 1: Landing
- [ ] 1.1 route group + layout
- [ ] 1.2 Header
- [ ] 1.3 Hero
- [ ] 1.4 Features
- [ ] 1.5 WhyZarNama
- [ ] 1.6 PriceWidget
- [ ] 1.7 GoldCalculator
- [ ] 1.8 Stats
- [ ] 1.9 Testimonials
- [ ] 1.10 FAQ
- [ ] 1.11 TrustBadges + Footer + DownloadApp
- [ ] 1.12 SEO metadata + sitemap

### Phase 2: Auth
- [ ] 2.1 ورود + OTP
- [ ] 2.2 سرویس OTP + rate limit
- [ ] 2.3 ثبت‌نام
- [ ] 2.4 JWT + cookie
- [ ] 2.5 middleware
- [ ] 2.6 فراموشی رمز
- [ ] 2.7 تغییر رمز
- [ ] 2.8 2FA
- [ ] 2.9 refresh rotation
- [ ] 2.10 bcrypt + pepper
- [ ] 2.11 لاگ ورود
- [ ] 2.12 مدیریت نشست

### Phase 3: User Panel
- [ ] 3.1 لایوت پنل
- [ ] 3.2 bottom nav موبایل
- [ ] 3.3 داشبورد
- [ ] 3.4 نمودار دارایی
- [ ] 3.5 منوی کناری
- [ ] 3.6 هدر پنل
- [ ] 3.7 پروفایل
- [ ] 3.8 آپلود آواتار
- [ ] 3.9 تنظیمات اعلان
- [ ] 3.10 تنظیمات امنیتی
- [ ] 3.11 مدیریت نشست
- [ ] 3.12 404 + error boundary

### Phase 4: KYC
- [ ] 4.1 سطح ۱
- [ ] 4.2 سطح ۲ فرم
- [ ] 4.3 ذخیره امن فایل
- [ ] 4.4 OCR
- [ ] 4.5 سلفی
- [ ] 4.6 ویدیو
- [ ] 4.7 face match
- [ ] 4.8 صفحه وضعیت
- [ ] 4.9 پنل ادمین KYC
- [ ] 4.10 محدودیت بر اساس سطح
- [ ] 4.11 اطلاع‌رسانی
- [ ] 4.12 audit log

### Phase 5: Pricing
- [ ] 5.1 fetch API خارجی
- [ ] 5.2 cron + ذخیره
- [ ] 5.3 fallback
- [ ] 5.4 override ادمین
- [ ] 5.5 API /price
- [ ] 5.6 Socket.io
- [ ] 5.7 ویجت لندینگ
- [ ] 5.8 نمودار تاریخچه
- [ ] 5.9 هشدار قیمت
- [ ] 5.10 کش Redis
- [ ] 5.11 لاگ
- [ ] 5.12 گزارش

### Phase 6: Trading
- [ ] 6.1 صفحه خرید
- [ ] 6.2 محاسبه کارمزد
- [ ] 6.3 lock قیمت
- [ ] 6.4 POST /orders + idempotency
- [ ] 6.5 DB transaction
- [ ] 6.6 Ledger + Wallet
- [ ] 6.7 صفحه فروش
- [ ] 6.8 OTP معاملات بزرگ
- [ ] 6.9 تاریخچه
- [ ] 6.10 فاکتور PDF
- [ ] 6.11 محدودیت روزانه
- [ ] 6.12 لغو سفارش

### Phase 7: Wallet
- [ ] 7.1 کیف پول ریالی
- [ ] 7.2 شارژ درگاه
- [ ] 7.3 برداشت
- [ ] 7.4 تاریخچه
- [ ] 7.5 اکسپورت
- [ ] 7.6 انتقال طلا
- [ ] 7.7 تحویل فیزیکی
- [ ] 7.8 مدیریت IBAN
- [ ] 7.9 OTP برداشت
- [ ] 7.10 محدودیت
- [ ] 7.11 reconciliation
- [ ] 7.12 گزارش

### Phase 8: Installment
- [ ] 8.1 صفحه طرح‌ها
- [ ] 8.2 محاسبه اقساط
- [ ] 8.3 internal_credit
- [ ] 8.4 cheque
- [ ] 8.5 ضامن
- [ ] 8.6 صف ادمین
- [ ] 8.7 جدول اقساط
- [ ] 8.8 پرداخت قسط
- [ ] 8.9 جریمه
- [ ] 8.10 یادآوری
- [ ] 8.11 گزارش
- [ ] 8.12 نکول

### Phase 9: Investment
- [ ] 9.1 صفحه طرح‌ها
- [ ] 9.2 نرخ ادمین
- [ ] 9.3 قفل طلا
- [ ] 9.4 سود روزشمار
- [ ] 9.5 پرداخت سود
- [ ] 9.6 تاریخچه
- [ ] 9.7 پایان طرح
- [ ] 9.8 تمدید
- [ ] 9.9 زودکرد
- [ ] 9.10 پنل ادمین
- [ ] 9.11 گزارش
- [ ] 9.12 اطلاع‌رسانی

### Phase 10: Assets
- [ ] 10.1 صفحه دارایی
- [ ] 10.2 نمودار توزیع
- [ ] 10.3 ارزش کل
- [ ] 10.4 سود/زیان
- [ ] 10.5 نمودار زمان
- [ ] 10.6 گزارش PDF
- [ ] 10.7 مقایسه شاخص
- [ ] 10.8 پیش‌بینی
- [ ] 10.9 اکسپورت
- [ ] 10.10 اشتراک لینک
- [ ] 10.11 فیلتر زمانی
- [ ] 10.12 آمار تفصیلی

### Phase 11: Ticket
- [ ] 11.1 لیست تیکت
- [ ] 11.2 ساخت تیکت
- [ ] 11.3 چت real-time
- [ ] 11.4 پیوست
- [ ] 11.5 وضعیت
- [ ] 11.6 تخصیص اپراتور
- [ ] 11.7 SLA
- [ ] 11.8 timeline
- [ ] 11.9 رضایت‌سنجی
- [ ] 11.10 پایه دانش
- [ ] 11.11 canned responses
- [ ] 11.12 گزارش

### Phase 12: Referral
- [ ] 12.1 کد دعوت
- [ ] 12.2 لینک + deep link
- [ ] 12.3 صفحه آمار
- [ ] 12.4 ثبت در ثبت‌نام
- [ ] 12.5 پاداش + شرط
- [ ] 12.6 گزارش
- [ ] 12.7 درخت دعوت
- [ ] 12.8 سقف ماهانه
- [ ] 12.9 اطلاع‌رسانی
- [ ] 12.10 پنل ادمین
- [ ] 12.11 anti-abuse
- [ ] 12.12 آمار conversion

### Phase 13: Notifications
- [ ] 13.1 مرکز اعلان
- [ ] 13.2 Web Push
- [ ] 13.3 FCM
- [ ] 13.4 APNs
- [ ] 13.5 تنظیمات per type
- [ ] 13.6 اعلان قیمت
- [ ] 13.7 اعلان تراکنش
- [ ] 13.8 اعلان تیکت
- [ ] 13.9 اعلان دعوت
- [ ] 13.10 اعلان قسط
- [ ] 13.11 اعلان سود
- [ ] 13.12 صف + retry

### Phase 14: Admin Users
- [ ] 14.1 لیست کاربران
- [ ] 14.2 جستجو + فیلتر
- [ ] 14.3 جزئیات
- [ ] 14.4 ویرایش
- [ ] 14.5 block
- [ ] 14.6 KYC
- [ ] 14.7 سطح
- [ ] 14.8 محدودیت
- [ ] 14.9 تراکنش‌ها
- [ ] 14.10 موجودی دستی
- [ ] 14.11 گزارش فعالیت
- [ ] 14.12 اکسپورت

### Phase 15: Admin Finance
- [ ] 15.1 لیست معاملات
- [ ] 15.2 جستجو
- [ ] 15.3 جزئیات
- [ ] 15.4 لغو
- [ ] 15.5 کارمزد
- [ ] 15.6 spread
- [ ] 15.7 گزارش روزانه
- [ ] 15.8 نمودار
- [ ] 15.9 برداشت‌ها
- [ ] 15.10 تایید برداشت
- [ ] 15.11 گزارش مالی
- [ ] 15.12 reconciliation

### Phase 16: Admin Content
- [ ] 16.1 بنر
- [ ] 16.2 FAQ
- [ ] 16.3 وبلاگ
- [ ] 16.4 قیمت
- [ ] 16.5 کارمزد
- [ ] 16.6 OTP
- [ ] 16.7 RBAC
- [ ] 16.8 audit log
- [ ] 16.9 پشتیبان
- [ ] 16.10 تنظیمات عمومی
- [ ] 16.11 مجوزها
- [ ] 16.12 داشبورد

### Phase 17: Security
- [ ] 17.1 rate limiting
- [ ] 17.2 CORS
- [ ] 17.3 CSRF
- [ ] 17.4 XSS + CSP
- [ ] 17.5 SQLi
- [ ] 17.6 audit log
- [ ] 17.7 تشخیص مشکوک
- [ ] 17.8 قفل اکانت
- [ ] 17.9 IP whitelist
- [ ] 17.10 encryption
- [ ] 17.11 backup encryption
- [ ] 17.12 security headers

### Phase 18: PWA
- [ ] 18.1 manifest
- [ ] 18.2 service worker
- [ ] 18.3 offline
- [ ] 18.4 add to home
- [ ] 18.5 splash
- [ ] 18.6 icons
- [ ] 18.7 Capacitor plugins
- [ ] 18.8 Android build
- [ ] 18.9 iOS PWA
- [ ] 18.10 native plugins
- [ ] 18.11 store assets
- [ ] 18.12 auto-update

### Phase 19: Testing
- [ ] 19.1 unit
- [ ] 19.2 integration
- [ ] 19.3 E2E
- [ ] 19.4 security
- [ ] 19.5 load
- [ ] 19.6 performance
- [ ] 19.7 PWA
- [ ] 19.8 responsive
- [ ] 19.9 financial
- [ ] 19.10 ledger
- [ ] 19.11 race
- [ ] 19.12 regression

### Phase 20: DevOps
- [ ] 20.1 Dockerfile
- [ ] 20.2 CI/CD
- [ ] 20.3 staging
- [ ] 20.4 production
- [ ] 20.5 monitoring
- [ ] 20.6 logs
- [ ] 20.7 backup
- [ ] 20.8 scaling
- [ ] 20.9 CDN
- [ ] 20.10 SSL
- [ ] 20.11 domain
- [ ] 20.12 docs

### Phase 21: Analytics
- [ ] 21.1 PostHog
- [ ] 21.2 events
- [ ] 21.3 acquisition
- [ ] 21.4 trading
- [ ] 21.5 financial
- [ ] 21.6 retention
- [ ] 21.7 referral
- [ ] 21.8 risk
- [ ] 21.9 funnel
- [ ] 21.10 KYC conversion
- [ ] 21.11 installment
- [ ] 21.12 investment

### Phase 22: SEO
- [ ] 22.1 metadata
- [ ] 22.2 structured data
- [ ] 22.3 sitemap
- [ ] 22.4 robots
- [ ] 22.5 canonical
- [ ] 22.6 OG
- [ ] 22.7 landing pages
- [ ] 22.8 blog SEO
- [ ] 22.9 internal linking
- [ ] 22.10 performance
- [ ] 22.11 hreflang
- [ ] 22.12 schema validator

### Phase 23: Performance
- [ ] 23.1 lazy loading
- [ ] 23.2 code splitting
- [ ] 23.3 image optimization
- [ ] 23.4 cache
- [ ] 23.5 DB optimization
- [ ] 23.6 bundle
- [ ] 23.7 PWA caching
- [ ] 23.8 mobile
- [ ] 23.9 API
- [ ] 23.10 CDN
- [ ] 23.11 CWV monitoring
- [ ] 23.12 Lighthouse CI

### Phase 24: Documentation
- [ ] 24.1 README
- [ ] 24.2 ARCHITECTURE
- [ ] 24.3 API
- [ ] 24.4 DATABASE
- [ ] 24.5 SECURITY
- [ ] 24.6 DEPLOYMENT
- [ ] 24.7 TESTING
- [ ] 24.8 PRODUCT
- [ ] 24.9 ADMIN
- [ ] 24.10 MOBILE + PWA
- [ ] 24.11 RUNBOOK
- [ ] 24.12 INCIDENT_RESPONSE

### Phase 25: Launch
- [ ] 25.1 pentest
- [ ] 25.2 bug bash
- [ ] 25.3 performance audit
- [ ] 25.4 security audit
- [ ] 25.5 accessibility audit
- [ ] 25.6 backup test
- [ ] 25.7 DR drill
- [ ] 25.8 monitoring
- [ ] 25.9 runbook
- [ ] 25.10 soft launch
- [ ] 25.11 feedback
- [ ] 25.12 production launch

---

## بخش ۳۶ — Future Expansion (پس از V1)

- وام ریالی با پشتوانه طلا
- کارت بانکی زرنما
- بازار ثانویه OTC
- صندوق‌های سرمایه‌گذاری
- API عمومی
- اپ iOS Native (Swift)
- هوش مصنوعی پیشنهاد سرمایه‌گذاری
- اشتراک طلایی (VIP)
- هدیه طلا (gift card)
- ادغام با کیف پول‌های دیگر

---

## بخش ۳۷ — Assumptions

1. کاربران ایرانی با موبایل ایرانی ثبت‌نام می‌کنند (کد +۹۸)
2. واحد پول: ریال (display به تومان اختیاری)
3. واحد طلا: گرم (۱۸ عیار)
4. قیمت طلا به ریال/گرم
5. بازار ۲۴ ساعته (بدون توقف)
6. زبان پیش‌فرض: فارسی RTL
7. پشتیبانی از شماره موبایل ایرانی (۰۹x)
8. درگاه بانکی: زرین‌پال (قابل تغییر)
9. SMS: Kavenegar (قابل تغییر)
10. استقرار: cloud (قابل تغییر)

---

## بخش ۳۸ — DECISION REQUIRED (موارد نیازمند تصمیم کسب‌وکار)

1. نرخ دقیق Spread خرید/فروش
2. نرخ کارمزد معامله
3. سقف برداشت روزانه/ماهانه
4. حداقل موجودی برای تحویل فیزیکی
5. نرخ سوددهی طرح‌های investment (نیازمند تایید حقوقی - ربوی؟)
6. نرخ سود قسطی (مقررات اسلامی)
7. مدل جریمه دیرکرد قسط
8. مدل کمیسیون دعوت (تک/چند سطحی)
9. آیا سوددهی ریالی هم ارائه شود؟ (مقررات ربوی)
10. آیا نیاز به Pen-test شخص ثالث؟
11. استاندارد PCI-DSS مورد نیاز؟
12. آیا وام ریالی در V1؟ (خیر، V2)
13. آیا کارت بانکی اختصاصی؟ (خیر، V2)
14. سقف معاملات روزانه per KYC level
15. آیا تحویل فیزیکی در همه شهرها؟

---

**پایان MEGAPLAN**

این سند آماده است که به‌عنوان نقشه اجرای پروژه به Agent توسعه تحویل داده شود.
منتظر دستور `EXECUTE MEGAPLAN` می‌مانم.
