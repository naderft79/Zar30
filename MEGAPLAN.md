# MEGAPLAN — پلتفرم طلای آبشده زرسی

> سند جامع معماری و اجرای پروژه — نسخه 1.1 (اصلاح معماری — Double-Entry Ledger + دو Target Web/Mobile + نسخه‌های جدید)
> نقش‌های هم‌زمان: CTO, Product Manager, UX/UI Designer, Frontend/Backend/Database/DevOps/Security/Mobile/QA/FinTech Architect, Business Analyst, SEO/Performance Engineer
> وضعیت: آماده اجرا — منتظر دستور `EXECUTE MEGAPLAN`

---

## تصمیمات قطعی (تایید شده)

| موضوع                 | تصمیم                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| استک فرانت            | **Next.js 16.3.3** (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui + Turbopack                            |
| Node.js               | **Node.js 24 LTS** (pin در `.nvmrc` و `package.json` engines)                                                        |
| موبایل                | PWA کامل + Capacitor (Android native-ready, iOS PWA) — **دو Target از shared codebase**                              |
| بک‌اند                | Next.js Route Handlers (تک پروژه)                                                                                    |
| ORM/DB                | **PostgreSQL 18.x** + **Prisma ORM 7 Stable** (آماده upgrade به 8 بدون بازنویسی Financial Core)                      |
| کش/صف                 | Redis (ioredis) + BullMQ                                                                                             |
| Real-time             | Socket.io (قیمت لحظه‌ای، چت تیکت، اعلان‌ها)                                                                          |
| احراز هویت            | JWT (access + refresh) — **Web: httpOnly cookie / Mobile: secure token storage** (هم‌دامنه auth) + OTP + 2FA اختیاری |
| KYC                   | سه‌سطحی (موبایل → کارت ملی → سلفی+ویدیو)                                                                             |
| ساختار                | تک repo Next.js (app/ + api/)                                                                                        |
| MVP                   | گسترده (همه ماژول‌های اصلی + پنل ادمین)                                                                              |
| زبان/RTL              | فارسی RTL، کامنت فارسی، لاگ انگلیسی                                                                                  |
| رنگ                   | Navy `#1a2a4f`، Gold `#c9a227`، Cream `#f5ecd7`                                                                      |
| قیمت طلا              | API خارجی + ویرایش دستی ادمین                                                                                        |
| قسطی                  | هر دو (اعتبارسنجی داخلی + چک صیادی با ضامن)                                                                          |
| سوددهی                | به صورت طلا (تورم‌زدا)                                                                                               |
| نوتیفیکیشن            | Web Push + FCM + APNs + درون‌اپ + SMS + ایمیل                                                                        |
| **Ledger**            | **Double-Entry Ledger** (Transaction, Journal, Account, Entry) — نه signed ledger ساده                               |
| **Wallet**            | Container با **Asset Accountهای جدا** (Rial, Gold، قابل توسعه)                                                       |
| **Financial Offline** | **ممنوع** — تمام عملیات مالی Online و Server-authoritative                                                           |
| **Concurrency**       | **PostgreSQL Transaction + Row Lock** مرجع نهایی؛ Redis فقط coordination                                             |
| **Idempotency**       | **Durable در DB** (`IdempotencyRecord`) + Redis برای acceleration                                                    |
| **PWA/Serwist**       | **Spike در Phase 0** قبل از finalize (مشروط به تست)                                                                  |
| **Infrastructure V1** | **Docker + Reverse Proxy** (ساده)؛ Swarm/K8s در فازهای بعدی                                                          |
| **Rate Limits**       | **Configurable** (در DB `RateLimitConfig`) — نه hardcoded                                                            |

---

## بخش ۱ — Executive Summary

«زرسی» یک پلتفرم FinTech برای خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده ۱۸ عیار است. کاربر می‌تواند با هر مبلغی (حتی یک میلی‌گرم) طلا بخرد، بفروشد، در طرح‌های سوددهی سرمایه‌گذاری کند، خرید قسطی انجام دهد و در صورت رسیدن به حدنصاب، طلا را به‌صورت فیزیکی تحویل بگیرد.

**مزیت رقابتی**: تجربه پریمیوم، شفافیت کامل، Ledger قابل حسابرسی، معماری مقیاس‌پذیر، پشتیبانی کامل موبایل (PWA + Android native-ready).

**اهداف فنی**:

- Web + PWA + Android + iOS از یک Backend مشترک
- معماری Domain-Driven، قابل Scale
- امنیت FinTech-grade از ابتدا
- Ledger immutable با Double-Spending Prevention
- Core Web Vitals سبز، LCP < 2.5s

---

## بخش ۲ — Product Vision

**چشم‌انداز**: زرسی ساده‌ترین، امن‌ترین و شفاف‌ترین راه برای پس‌انداز و سرمایه‌گذاری روی طلا در ایران باشد.

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
- کارت بانکی اختصاصی زرسی (V2)
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

- کارمند زرسی
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

| دسته          | الزام                                               |
| ------------- | --------------------------------------------------- |
| Performance   | LCP < 2.5s, FID < 100ms, CLS < 0.1, API p95 < 300ms |
| Scale         | ۱۰۰k کاربر، ۱۰k concurrent، ۱M معامله/ماه           |
| Availability  | 99.9% (نسخه ۱)                                      |
| Security      | OWASP Top 10، PCI-DSS برای درگاه، رمزنگاری AES-256  |
| Accessibility | WCAG 2.1 AA                                         |
| Browser       | Chrome, Safari, Firefox, Edge (۲ نسخه اخیر)         |
| Mobile        | Android 8+, iOS 14+ (PWA)                           |
| i18n          | فارسی RTL (نسخه ۱)، آماده انگلیسی                   |
| Audit         | تمام عملیات مالی قابل حسابرسی                       |

---

## بخش ۹ — UX Architecture

### Information Architecture

```
زرسی
├── لندینگ (عمومی)
│   ├── هیرو، امکانات، قیمت، ماشین حساب، FAQ، وبلاگ، تماس
├── احراز هویت
│   ├── ورود، ثبت‌نام، فراموشی رمز، OTP
├── پنل کاربری (نیازمند لاگین) — قرارداد دائمی ۵ مقصدی (ADR-015)
│   ├── خانه (/dashboard): خلاصه حساب، KYC، دارایی، معاملات، اعلان‌ها، اقدام سریع، قسطی، referral، امنیت
│   ├── معاملات (/dashboard/trade): خرید/فروش طلا، قیمت لحظه‌ای، سفارش‌ها، تاریخچه، quote
│   ├── دارایی (/dashboard/assets): موجودی طلا/ریال، کیف پول، سود و زیان، تراکنش‌ها، واریز/برداشت
│   ├── قسطی (/dashboard/installments): طرح‌ها، قرارداد، اقساط، سررسید، پرداخت، تاریخچه
│   ├── پروفایل (/dashboard/profile): اطلاعات، KYC، امنیت، نشست‌ها، رمز، 2FA، اعلان‌ها، referral، پشتیبانی، legal
├── پنل ادمین (نیازمند نقش ادمین)
│   ├── داشبورد، کاربران، KYC، معاملات، مالی، محتوا، تنظیمات
```

### Navigation Patterns

- **قرارداد دائمی (ADR-015):** Navigation اصلی پنل کاربر همیشه دقیقاً ۵ مقصد است — خانه، معاملات، دارایی، قسطی، پروفایل. تغییر فقط با ADR رسمی.
- **دسکتاپ**: Top nav (لندینگ) + Premium Sidebar (پنل — همان ۵ مقصد)
- **موبایل**: Bottom navigation با همان ۵ مقصد و همان ترتیب + Hamburger (لندینگ)
- **اپ موبایل**: Bottom nav ثابت با همان ۵ مقصد
- اعلان‌ها/پشتیبانی/جستجو nav item نیستند — از Header و Profile در دسترس‌اند
- Source of Truth: `src/config/navigation.ts` — desktop و mobile از یک config مصرف می‌کنند

---

## بخش ۱۰ — UI Design System

### PERMANENT DESIGN LANGUAGE (ADR-016)

امضای بصری: **«Luxury Private Banking for Gold»** — قانون دائمی برای همه Phaseها و platformها.

**اولویت رنگ (ترتیب ثابت):**

1. **Navy → Primary/Dominant** — Canvas اصلی (`navy-950…100` چندلایه برای depth)
2. **Gold → Luxury Accent/Action** — CTA، nav فعال، متریک مهم، قیمت، focus — کنترل‌شده
3. **Cream → Supporting Accent** — text روی navy، highlight — دیگر رنگ اصلی UI نیست
4. **Neutral → Text/Border/Secondary**

**Dark/Navy-First:** حالت اصلی برند dark/navy است (`:root` = navy، `<html class="dark">`)؛ light فقط opt-in با `.light` و navy-primary.

### رنگ‌ها (Token-based — `src/app/globals.css`)

```css
/* Navy — Canvas اصلی برند */    --navy-950 … --navy-100
/* Gold — Luxury Accent */       --gold-700 … --gold-100
/* Cream — Supporting Accent */  --cream-50 … --cream-400
/* Semantic */                   --success #1f9d55 · --warning #d97706 · --error #d64545 · --info #3b82c4
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

### Design System ارتقایافته (Phase 3.1)

- **Token-based کامل** در `src/app/globals.css`: رنگ، radius، shadow، spacing، typography، motion، z-index، breakpoint — hardcode رنگ/سایه ممنوع
- **Dark Mode چندلایه**: app background، sidebar، card، elevated card، modal، input — عمق بصری واقعی
- **کامپوننت‌های مالی اختصاصی** (`src/components/financial/`): BalanceCard، PriceTicker، TransactionItem، OrderCard، QuoteCard، PortfolioChart، StatusCard، TrendBadge، FinancialNumber (count-up با reduced-motion)
- **Stateهای طراحی‌شده**: EmptyState، ErrorState، Skeleton shimmer، DataTable responsive (دسکتاپ جدول → موبایل کارت)
- **Motion**: duration/easing توکن‌دار + احترام به `prefers-reduced-motion`
- **Preview**: صفحه `/design-system` برای مشاهده کامپوننت‌ها و stateها
- فرمت مالی متمرکز در `src/lib/utils/format.ts` (اعداد فارسی، تومان، گرم طلا)

### States

- Empty, Loading (skeleton), Error (retry), Success, Pending, Locked, Disabled

---

## بخش ۱۱ — Technical Architecture

### Diagram (متن)

```
┌─────────────────────────────────────────┐
│  Clients                                │
│  Web (Next.js 16 SSR) | PWA | Android   │
│  (Capacitor) | iOS PWA                  │
└───────────────┬─────────────────────────┘
                │ HTTPS + WebSocket
┌───────────────▼─────────────────────────┐
│  Next.js 16.3.3 (App Router + Turbopack)│
│  ├─ app/ (SSR/SSG/ISR)                  │
│  ├─ api/ (Route Handlers)                │
│  ├─ Socket.io server                    │
│  └─ middleware (auth, rate-limit)       │
└───────┬───────────────┬─────────────────┘
        │               │
┌───────▼───────┐  ┌────▼─────┐  ┌──────────┐
│ PostgreSQL    │  │ Redis    │  │ Object   │
│ 18.x (Prisma  │  │ (cache,  │  │ Storage  │
│  7 Stable)    │  │ queue,   │  │ (S3/MinIO)│
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

### Web + Capacitor Architecture (دو Target)

```
Shared Codebase (src/)
      │
      ├── Web Target
      │    └── Next.js 16 SSR / Web (production build + Turbopack)
      │        ├── app/ (pages)
      │        ├── api/ (route handlers)
      │        └── PWA (manifest + SW)
      │
      └── Mobile Target
           └── Capacitor
               ├── Android (native shell)
               └── iOS (native shell, V2)
```

**نکات:**

- **Shared**: `src/lib/` (services, validators, types)، `src/components/` (UI)
- **Web**: Next.js SSR build با Turbopack
- **Mobile**: Capacitor از build جدا (static export یا webview)
- **Auth**: Web از httpOnly cookie، Mobile از secure token storage (Capacitor Preferences/Keychain)
- **هر دو** به همان `/api/v1` backend متصل می‌شوند

### WHY THIS TECHNOLOGY?

| تکنولوژی        | چرا؟                                                                               | چرا نه جایگزین؟                                                    |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Next.js 16.3.3  | SSR/SSG/ISR + API در یک پروژه، PWA عالی، Capacitor-ready، Turbopack، ecosystem قوی | Next.js 15: قدیمی‌تر؛ Remix: ecosystem کوچک‌تر؛ CRA: deprecate     |
| TypeScript      | type safety، refactoring، self-documenting                                         | JS خالص: ریسک در FinTech                                           |
| Tailwind v4     | سرعت، consistency، bundle کوچک                                                     | CSS خالص: کند در پروژه بزرگ                                        |
| shadcn/ui       | قابل customize، ownership کامل، Radix-based                                        | MUI: سنگین، کم‌انعطاف                                              |
| Prisma 7 Stable | type-safe، migration، ecosystem، آماده upgrade به 8 بدون بازنویسی                  | Drizzle: کم‌مستندتر؛ TypeORM: سنگین؛ Prisma 8 RC: هنوز پایدار نیست |
| PostgreSQL 18.x | ACID، JSONB، Ledger مناسب، مقیاس، مرجع نهایی Financial Integrity                   | MongoDB: ACID ضعیف برای مالی؛ MySQL: Decimal ضعیف‌تر               |
| Redis           | کش + صف + pubsub در یک ابزار (فقط برای coordination/acceleration)                  | Memcached: بدون صف                                                 |
| BullMQ          | صف شغل‌های قابل اعتماد                                                             | cron خالص: بدون retry                                              |
| Socket.io       | real-time با fallback، room برای تیکت                                              | SSE: یک‌طرفه؛ Polling: ناکارآمد                                    |
| Capacitor       | وب‌تکنالوژی → اپ native، آشنا، دو Target از shared codebase                        | React Native: کد جدا، پل پل                                        |
| Zustand         | سبک، ساده                                                                          | Redux: boilerplate زیاد                                            |
| TanStack Query  | cache، retry، invalidation                                                         | SWR: کم‌امکان‌تر                                                   |
| Zod             | validation runtime + type inference                                                | Yup: کم‌قدرتمندتر                                                  |

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

#### Wallet (Container — یک به یک با User)

- id, userId (unique FK), status (active/frozen)
- createdAt, updatedAt
- **نکته**: Wallet فقط container است. موجودی‌ها در AssetAccountها نگه‌داری می‌شوند.

#### AssetAccount (دارایی‌های جدا — قابل توسعه)

- id, walletId (FK), assetType (enum: RIAL, GOLD, SILVER, ...)
- balance (Decimal/BigInt بسته به asset)، lockedBalance
- availableBalance = balance - lockedBalance (computed)
- **نکته**: اضافه کردن Asset جدید (نقره، ارز) بدون تغییر بنیادی architecture.

#### LedgerAccount (حساب دفتری — Double-Entry)

- id, code (unique, e.g., "ASSET_RIAL", "ASSET_GOLD", "FEE_REVENUE", "SPREAD_REVENUE")
- type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- name, assetType (nullable، برای asset accounts)
- createdAt

#### JournalEntry (مجموعه atomic از LedgerEntryها — Double-Entry)

- id, referenceType (order/deposit/withdrawal/transfer/installment/investment/interest/fee)
- referenceId (polymorphic)
- description, status (posted/reversed)
- reversalOf (FK self، nullable — برای compensating transaction)
- createdAt (immutable)

#### LedgerEntry (immutable, append-only — Double-Entry)

- id, journalEntryId (FK), ledgerAccountId (FK)
- entryType (DEBIT/CREDIT)
- amountGold (Decimal(18,8), nullable)، amountRial (BigInt, nullable)
- balanceAfter (redundant برای performance)
- assetAccountId (nullable، برای asset accounts)
- createdAt (immutable)
- **قاعده**: هر JournalEntry باید balanced باشد (sum of debits = sum of credits)

#### Order

- id, userId (FK), type (buy/sell), goldAmount, rialAmount
- unitPrice, spread, fee, total, status (pending/locked/filled/cancelled/failed)
- priceLockExpiresAt, otpConfirmed, journalEntryId (FK، nullable)
- createdAt

#### Transaction (ریالی)

- id, walletId (FK), type (deposit/withdraw/fee/transfer)
- amount (signed), status (pending/completed/failed/reversed)
- gatewayRef, bankRef, journalEntryId (FK، nullable)
- createdAt

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

#### IdempotencyRecord (Durable — مرجع نهایی Idempotency)

- id, key (unique, از header Idempotency-Key)
- userId, endpoint, requestHash, responseHash
- status (processing/completed/failed), responseBody (json)
- createdAt, expiresAt
- **نکته**: Redis فقط برای acceleration است. این table مرجع نهایی است.

#### RateLimitConfig (Configurable Rate Limits)

- id, key (unique, e.g., "otp.send", "auth.login", "api.general")
- limit (int), windowSeconds (int), scope (ip/user/mobile)
- active (bool), updatedAt
- **نکته**: مقادیر hardcoded نیست. ادمین قابل تنظیم.

#### AuditLog (immutable)

- id, actorType (user/admin/system), actorId, action, entityType, entityId
- before (json), after (json), ip, userAgent, createdAt

#### AdminUser

- id, userId (FK), role (enum), permissions (json), active

#### CmsContent

- id, key (unique), type (banner/faq/blog/page), title, body, slug, status, publishedAt

#### FeatureFlag

- id, key (unique), enabled, rolloutPercent, description

### اصول طراحی (اصلاح‌شده با Double-Entry)

- **Double-Entry Ledger**: هر JournalEntry باید balanced باشد (sum of debits = sum of credits)
- **Immutable**: LedgerEntry, JournalEntry, AuditLog, TicketMessage, GoldPrice, KycSubmission
- **Reversal**: اصلاح با compensating JournalEntry (نه UPDATE) — فیلد `reversalOf`
- **Asset Accounts جدا**: Rial و Gold در AssetAccountهای متمایز (قابل توسعه به نقره، ارز)
- **Double-Spending Prevention**: PostgreSQL Transaction + SELECT FOR UPDATE (مرجع نهایی)؛ Redis فقط برای distributed coordination
- **Idempotency**: `Idempotency-Key` در header → چک Redis (acceleration) → چک `IdempotencyRecord` (durable) → اجرا
- **Reconciliation**: cron روزانه: SUM(LedgerEntry per account) = AssetAccount.balance → اگر mismatch → alert + freeze
- **Decimal**: تمام مبالغ طلا `Decimal(18,8)`، ریالی `BigInt`
- **Soft Delete**: User با status=deleted، نه حذف فیزیکی (audit)

### Indexes

- LedgerEntry: (journalEntryId), (ledgerAccountId, createdAt), (assetAccountId, createdAt)
- JournalEntry: (referenceType, referenceId), (status)
- AssetAccount: (walletId, assetType)
- Order: (userId, createdAt), (status)
- GoldPrice: (recordedAt desc)
- AuditLog: (actorId, createdAt), (entityType, entityId)
- Ticket: (userId, status), (assignedTo, status)
- IdempotencyRecord: (key), (userId, endpoint), (expiresAt)

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

- JWT access (۱۵ دقیقه) + refresh (۳۰ روز)
- **Web**: httpOnly + Secure + SameSite=Lax cookie
- **Mobile (Capacitor)**: secure token storage (Capacitor Preferences/Keychain) + Bearer header
- **هم‌دامنه Auth**: هر دو به همان `/api/v1/auth/*` متصل؛ backend تشخیص Web/Mobile و پاسخ مناسب
- Refresh rotation + reuse detection
- RBAC با ۹ نقش ادمین + permission granular
- 2FA اختیاری (TOTP با otpauth)

### OTP

- ۶ رقم، TTL ۲ دقیقه، max ۵ تلاش، فاصله ۶۰ ثانیه بین ارسال
- hash با bcrypt + pepper
- rate limit با Redis (slide window) — **مقادیر از `RateLimitConfig` قابل تنظیم**

### Rate Limiting (Configurable — نه hardcoded)

- مقادیر در DB table `RateLimitConfig` ذخیره می‌شوند
- ادمین می‌تواند بدون تغییر کد، مقادیر را تغییر دهد
- **پیش‌فرض‌ها (قابل تغییر)**:
  - `api.general`: ۱۰۰ req/min per IP
  - `otp.send`: ۵/ساعت per mobile
  - `auth.login`: ۱۰/ساعت per mobile
  - `trading.execute`: ۳۰/min per user
  - `admin.api`: ۲۰۰/min per admin

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

| سطح | سقف خرید روزانه     | برداشت           | تحویل فیزیکی | قسطی        |
| --- | ------------------- | ---------------- | ------------ | ----------- |
| ۱   | ۵ مبنای طلا         | خیر              | خیر          | خیر         |
| ۲   | ۵۰ مبنای طلا        | تا ۵۰ مبنای ریال | خیر          | تا ۵۰ مبنای |
| ۳   | نامحدود (با review) | کامل             | بله          | کامل        |

### Audit

- هر تغییر status در KycSubmission + AuditLog

---

## بخش ۱۶ — Trading Architecture

### Pricing Engine

- cron هر ۶۰ ثانیه: fetch از API خارجی → ذخیره GoldPrice → emit Socket.io
- fallback: آخرین قیمت معتبر در صورت قطعی API
- ادمین می‌تواند override دستی (با audit)

### Order Flow (Double-Entry)

1. کاربر درخواست preview → backend قیمت لحظه‌ای + spread + fee را محاسبه
2. lock قیمت به مدت ۶۰ ثانیه (Redis: `price:lock:{userId}`)
3. کاربر تایید → POST /orders با Idempotency-Key
4. backend در یک **PostgreSQL Transaction**:
   - SELECT FOR UPDATE روی AssetAccount (Rial + Gold) — **مرجع نهایی**
   - بررسی موجودی کافی (availableBalance)
   - ایجاد JournalEntry (balanced: debit Gold + credit Rial)
   - ایجاد LedgerEntry (DEBIT) روی AssetAccount Gold
   - ایجاد LedgerEntry (CREDIT) روی AssetAccount Rial
   - ایجاد LedgerEntry (DEBIT) روی Fee Revenue account (کارمزد)
   - آپدیت AssetAccount.balance (redundant)
   - ایجاد Order (status=filled, journalEntryId)
5. اگر مبلغ > threshold → OTP تایید
6. emit notification + Socket.io

### Cancel

- فقط در status=pending (قبل از fill) قابل لغو
- اگر filled → فقط با Reversal JournalEntry (compensating transaction)

---

## بخش ۱۷ — Wallet/Ledger Architecture (Double-Entry)

### اصل مهم (اصلاح‌شده)

- **Double-Entry Ledger**: هر JournalEntry باید balanced باشد (sum of debits = sum of credits)
- **Ledger append-only immutable**: هیچ آپدیت/حذف روی LedgerEntry و JournalEntry
- **Reversal**: اصلاح با compensating JournalEntry (فیلد `reversalOf`)، نه UPDATE
- **AssetAccount.balance** = جمع LedgerEntryهای آن account (redundant برای performance)
- **Double-Spending Prevention**: **PostgreSQL Transaction + SELECT FOR UPDATE** (مرجع نهایی)؛ Redis فقط برای distributed coordination در multi-instance
- **Idempotency**: `Idempotency-Key` در header → چک Redis (acceleration) → چک `IdempotencyRecord` (durable در DB) → اجرا → ذخیره response در DB
- **Asset Accounts جدا**: Rial و Gold در AssetAccountهای متمایز (قابل توسعه به نقره، ارز)

### Reconciliation

- cron روزانه: `SUM(LedgerEntry per AssetAccount) = AssetAccount.balance` → اگر mismatch → alert + freeze
- cron روزانه: هر JournalEntry باید balanced باشد → اگر نبود → alert

### Transfer داخلی (Double-Entry)

- در یک PostgreSQL transaction:
  - JournalEntry (balanced)
  - LedgerEntry (CREDIT) از AssetAccount A (Gold)
  - LedgerEntry (DEBIT) به AssetAccount B (Gold)
  - آپدیت هر دو AssetAccount.balance

### Financial Offline Operations (ممنوع)

- **هیچ عملیات مالی نباید Offline Queue شود**
- ممنوع: Buy, Sell, Deposit, Withdrawal, Payment, Installment, Investment, Transfer, Settlement
- مجاز (offline): UI shell, static content, preferences, draft (غیرمالی)
- **قاعده**: Financial State هرگز با Offline Data به‌عنوان حقیقت نمایش داده نمی‌شود. اگر offline، نمایش "اتصال لازم" به جای موجودی.

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
- لینک: `https://zar30.com/r/{code}` → redirect به لندینگ با cookie referral
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

| Role        | دسترسی                     |
| ----------- | -------------------------- |
| Super Admin | همه                        |
| Finance     | تراکنش، برداشت، گزارش مالی |
| Support     | تیکت، کاربران (read)       |
| KYC         | بررسی KYC                  |
| Risk        | risk engine، fraud         |
| Content     | CMS، وبلاگ، بنر            |
| Operations  | سیستم، feature flags       |
| Analyst     | گزارش‌ها (read)            |
| Read Only   | مشاهده                     |

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

### Web + Capacitor (دو Target از Shared Codebase)

```
Shared Codebase (src/)
      │
      ├── Web Target
      │    └── Next.js 16 SSR / Web (production build + Turbopack)
      │        ├── app/ (pages)
      │        ├── api/ (route handlers)
      │        └── PWA (manifest + SW)
      │
      └── Mobile Target
           └── Capacitor
               ├── Android (native shell)
               └── iOS (native shell, V2)
```

- **Shared**: `src/lib/` (services, validators, types)، `src/components/` (UI)
- **Web**: Next.js SSR build با Turbopack
- **Mobile**: Capacitor از build جدا (static export یا webview)
- **Auth**: Web از httpOnly cookie، Mobile از secure token storage (Capacitor Preferences/Keychain)
- **هر دو** به همان `/api/v1` backend متصل می‌شوند

### PWA (مشروط به Spike در Phase 0)

- `manifest.webmanifest` (icons, shortcuts, screenshots, display standalone)
- Service Worker: **Serwist مشروط به تست** (Spike در Phase 0)؛ اگر fail → Workbox یا custom SW
- **Offline (ممنوع برای مالی)**: فقط UI shell + static content + preferences + draft غیرمالی
- **Financial State هرگز با Offline Data به‌عنوان حقیقت نمایش داده نمی‌شود**
- Add to Home Screen prompt (custom)
- Splash screen (Android + iOS)

### Capacitor (Android)

- `capacitor.config.ts`
- Plugins: Camera (KYC), Push (FCM), Share, Haptics, App, Network, Preferences (secure storage)
- Build: build جدا از Web → `npx cap sync` → Android Studio
- Deep links: `zar30://` + universal links

### iOS PWA

- Push notifications (iOS 16.4+)
- محدودیت‌ها: no background fetch طولانی، storage محدود

### Authentication (دو استراتژی، هم‌دامنه)

- **Web**: httpOnly + Secure + SameSite cookie
- **Mobile (Capacitor)**: secure token storage (Preferences/Keychain) + Bearer header
- **هر دو** به همان `/api/v1/auth/*` backend متصل؛ backend تشخیص Web/Mobile و پاسخ مناسب

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

| نوع         | ابزار                     | پوشش                        |
| ----------- | ------------------------- | --------------------------- |
| Unit        | Vitest                    | توابع، services, validators |
| Integration | Vitest + supertest        | API endpoints               |
| E2E         | Playwright                | جریان‌های کلیدی             |
| Security    | OWASP ZAP, npm audit      | اسکن خودکار                 |
| Load        | k6                        | ۱۰۰۰ concurrent             |
| Performance | Lighthouse CI             | Core Web Vitals             |
| PWA         | Lighthouse PWA + manual   | install, offline            |
| Responsive  | Playwright + BrowserStack | breakpoints                 |
| Financial   | Vitest (property-based)   | محاسبات، ledger             |
| Concurrency | k6 + custom               | race conditions             |
| Regression  | Vitest snapshot           | UI components               |

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

### Stack (V1 ساده — بیش از حد پیچیده نیست)

- Container: Docker (multi-stage)
- Orchestration V1: **Docker + Reverse Proxy** (ساده) → Swarm/Kubernetes در فازهای بعدی و در صورت نیاز واقعی
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

| Risk                | Prob  | Impact | Mitigation                                   | Contingency                      |
| ------------------- | ----- | ------ | -------------------------------------------- | -------------------------------- |
| API قیمت قطع شود    | متوسط | بالا   | fallback آخرین قیمت + override ادمین         | قرارداد با منبع دوم              |
| Double-spending bug | کم    | بحرانی | DB transaction + Redis lock + reconciliation | freeze سیستم + rollback          |
| Data breach         | کم    | بحرانی | encryption + pentest + RBAC                  | incident response + notify users |
| Fraud قسطی          | متوسط | بالا   | risk engine + ضامن + چک صیادی                | اجرای چک + مسدودسازی             |
| Run on withdrawals  | کم    | بحرانی | liquidity reserve + daily limit              | توقف موقت برداشت                 |
| PWA iOS محدودیت     | متوسط | متوسط  | تست + fallback به web                        | اپ native در V2                  |
| Scale bottleneck    | متوسط | متوسط  | cache + read replica + queue                 | scale horizontal                 |
| Regulatory change   | متوسط | بالا   | مشاور حقوقی + design flexible                | pivot model                      |
| OTP SMS قطع شود     | کم    | بالا   | fallback به voice OTP + email OTP            |                                  |
| Ledger corruption   | کم    | بحرانی | immutable + backup + reconciliation          | restore from backup              |

---

## بخش ۲۹ — Dependency Graph

```
Phase 0 (setup + PWA spike) ─┬─> Phase 1 (landing)
                             ├─> Phase 2 (auth: web + mobile)
                             │
Phase 2 ─────────────────────┴─> Phase 3 (user panel base)
                                  │
Phase 5 (price) ──────────────────┤
Phase 4 (KYC) ───────────────────┼─> Phase 6 (trading: double-entry) ─> Phase 7 (wallet: asset accounts)
                                  │                                       │
                                  ├─> Phase 8 (installment) ──────────────┤
                                  ├─> Phase 9 (investment) ──────────────┤
                                  ├─> Phase 10 (assets) ────────────────┤
                                  ├─> Phase 11 (ticket) ────────────────┤
                                  ├─> Phase 12 (referral) ──────────────┤
                                  ├─> Phase 13 (notification) ─────────┤
                                  │
Phase 14-16 (admin) ──────────────┘ (parallel بعد از Phase 3)
Phase 17 (security) ───────────── cross-cutting (همه فازها)
Phase 18 (PWA finalize) ────────── بعد از Spike (Phase 0) + Phase 1 + 3
Phase 19 (testing) ────────────── cross-cutting
Phase 20 (devops: docker + reverse proxy) ── بعد از Phase 0
Phase 21 (analytics) ─────────── بعد از Phase 6
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
zar30/
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

### Phase 0: Setup & Infrastructure + PWA Spike

1. نصب **Node.js 24 LTS** + pin در `.nvmrc` (محتوای: `24`) و `package.json` engines (`"node": ">=24.0.0"`)
2. `pnpm create next-app@16.3.3` با TypeScript strict + Tailwind v4 + App Router + **Turbopack**
3. نصب وابستگی‌ها: `prisma@7` + `@prisma/client@7`، `ioredis`، `bullmq`، `socket.io`، `zod`، `jose`، `bcryptjs`، `zustand`، `@tanstack/react-query`، `recharts`، `sonner`، `lucide-react`، `react-hook-form` + `@hookform/resolvers`
4. shadcn/ui: `pnpm dlx shadcn@latest init`
5. ESLint + Prettier + Husky + lint-staged
6. ساخت ساختار پوشه‌ها (طبق بخش ۳۰)
7. Tailwind v4 با پالت navy/gold/cream + تم تیره
8. فونت Vazirmatn با next/font + RTL در layout
9. **PostgreSQL 18.x**: `docker-compose.yml` با `postgres:18.x` (explicit minor) + **Redis 7**
10. **Prisma 7**: `prisma init` + schema پایه (User, Session, OtpCode, IdempotencyRecord, RateLimitConfig, LedgerAccount, JournalEntry, LedgerEntry, AssetAccount)
11. نصب Capacitor + `cap init` (با awareness از دو Target: Web + Mobile)
12. **PWA Spike**: تست Serwist با Next.js 16.3.3 + Turbopack:
    - [ ] Installability (Chrome Android, Safari iOS)
    - [ ] Service Worker registration
    - [ ] Cache invalidation
    - [ ] Update behavior
    - [ ] Push notifications
    - [ ] Offline shell (non-financial فقط)
    - [ ] Safari iOS behavior
    - [ ] Production build (Turbopack)
    - [ ] Deployment build
    - اگر Serwist fail → انتخاب جایگزین (Workbox/custom SW) و مستندسازی در `docs/ARCHITECTURE_DECISIONS.md`
13. `.env.example` با تمام متغیرها (DB, Redis, JWT, OTP, SMS, Payment, Push)
14. `README.md` اولیه
15. `docs/ARCHITECTURE_DECISIONS.md` با تصمیمات این فاز (شامل نتایج PWA Spike)

- **Acceptance**: `pnpm dev` با Turbopack اجرا شود، `pnpm lint` pass، docker up (PostgreSQL 18 + Redis)، `npx cap` کار کند، `.nvmrc` با `24`، PWA Spike نتایج ثبت شده (pass یا fail + جایگزین)

### Phase 1: Landing Page

1. `(landing)` route group + layout
2. Header با ناوبری + دکمه ورود/ثبت‌نام (responsive)
3. Hero با شعار + CTA + تصویر پریمیوم
4. Features (۶ کارت: خرید، فروش، قسطی، سوددهی، تحویل فیزیکی، انتقال)
5. WhyZar30 (مزایا با آیکون)
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

- [ ] 0.1 نصب Node.js 24 LTS + pin در `.nvmrc`
- [ ] 0.2 ساخت پروژه Next.js 16.3.3 + Turbopack
- [ ] 0.3 نصب وابستگی‌ها (Prisma 7, ioredis, bullmq, ...)
- [ ] 0.4 ESLint + Prettier + Husky
- [ ] 0.5 ساختار پوشه‌ها
- [ ] 0.6 Tailwind v4 + پالت رنگی
- [ ] 0.7 فونت Vazirmatn + RTL
- [ ] 0.8 Prisma 7 + schema پایه (Double-Entry + Asset Accounts + Idempotency)
- [ ] 0.9 docker-compose (PostgreSQL 18.x + Redis 7)
- [ ] 0.10 Capacitor init (دو Target)
- [ ] 0.11 PWA Spike (Serwist + Turbopack + تست‌ها)
- [ ] 0.12 .env.example + README + ARCHITECTURE_DECISIONS

### Phase 1: Landing

- [ ] 1.1 route group + layout
- [ ] 1.2 Header
- [ ] 1.3 Hero
- [ ] 1.4 Features
- [ ] 1.5 WhyZar30
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

### Phase 18: PWA (Finalize — پس از Spike)

- [ ] 18.1 manifest نهایی
- [ ] 18.2 service worker (Serwist یا جایگزین از Spike)
- [ ] 18.3 offline (فقط non-financial: UI shell + static)
- [ ] 18.4 add to home
- [ ] 18.5 splash
- [ ] 18.6 icons
- [ ] 18.7 Capacitor plugins (camera, push, share, preferences)
- [ ] 18.8 Android build
- [ ] 18.9 iOS PWA
- [ ] 18.10 native plugins
- [ ] 18.11 store assets
- [ ] 18.12 auto-update SW

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
- کارت بانکی زرسی
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
11. Docker image `postgres:18.x` (آخرین minor پایدار ۱۸)
12. Docker image `redis:7-alpine`
13. pnpm 9+ به‌عنوان package manager
14. Vitest برای unit/integration، Playwright برای E2E
15. MinIO برای object storage (S3-compatible)
16. Caddy به‌عنوان reverse proxy (auto TLS)
17. Sentry برای error tracking
18. PostHog self-hosted برای analytics
19. دامنه `zar30.com` (قابل تغییر)
20. فونت Vazirmatn (استاندارد فارسی)

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
16. ارائه‌دهنده API قیمت طلا (طلاچارت/بازارچارت/TGJU)
17. ارائه‌دهنده SMS (Kavenegar/فراز)
18. درگاه بانکی (زرین‌پال/سامان)
19. آیا نتایج PWA Spike (در Phase 0) نیاز به تأیید شما دارد؟ یا خودم تصمیم می‌گیرم؟
20. در صورت fail شدن Serwist، آیا جایگزین (Workbox/custom SW) را خودم انتخاب کنم؟

---

**پایان MEGAPLAN**

این سند آماده است که به‌عنوان نقشه اجرای پروژه به Agent توسعه تحویل داده شود.
منتظر دستور `EXECUTE MEGAPLAN` می‌مانم.
