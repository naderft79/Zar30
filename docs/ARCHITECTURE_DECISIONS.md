# Zar30 — Architecture Decision Records (ADR)

> سند تصمیمات معماری پروژه زرسی — Phase 0

## ADR-001: نسخه‌های Baseline

| تکنولوژی   | تصمیم                               | دلیل                                  |
| ---------- | ----------------------------------- | ------------------------------------- |
| Next.js    | 16.3.3 (pinned)                     | دستور کاربر — baseline پروژه          |
| Node.js    | 24 LTS (`.nvmrc` = `24`)            | دستور کاربر — engines در package.json |
| PostgreSQL | 18.x (Docker: `postgres:18-alpine`) | دستور کاربر                           |
| Prisma ORM | 7.10.0 (آخرین stable 7)             | دستور کاربر — Prisma 8 فعلاً RC است   |
| Redis      | 7.x (Docker: `redis:7-alpine`)      | cache، queue، pub/sub — نه مرجع مالی  |

## ADR-002: Prisma 7 — Driver Adapter

**تصمیم:** استفاده از `@prisma/adapter-pg` برای اتصال PostgreSQL

**دلیل:** Prisma 7 دیگر اتصال مستقیم به DB ندارد — باید از Driver Adapter استفاده شود:

```typescript
import { PrismaPg } from '@prisma/adapter-pg'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })
```

**پیامد:** `DATABASE_URL` در `prisma.config.ts` (نه schema.prisma) پیکربندی می‌شود.

## ADR-003: Double-Entry Ledger

**تصمیم:** مدل مالی بر اساس Double-Entry Accounting

**مفاهیم:**

- `FinancialTransaction` → رویداد کسب‌وکار
- `JournalEntry` → مجموعه atomic متوازن (debit = credit)
- `LedgerAccount` → حساب دفتری (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- `LedgerEntry` → رکورد immutable debit/credit
- `AssetAccount` → حساب دارایی کاربر (RIAL, GOLD, قابل توسعه)
- `Balance` → جمع LedgerEntryها (redundant + reconciliation)
- `Reversal` → compensating transaction (نه UPDATE)

**قواعد:**

- هر JournalEntry باید balanced باشد
- LedgerEntry immutable (append-only)
- اصلاح با Reversal JournalEntry
- PostgreSQL مرجع نهایی Financial Integrity

## ADR-004: Wallet → Asset Accounts

**تصمیم:** Wallet به‌عنوان Container + Asset Accountهای جدا

```
User → Wallet → AssetAccount(RIAL) + AssetAccount(GOLD) + [آینده: SILVER, ...]
```

**مزیت:** اضافه کردن Asset جدید بدون تغییر بنیادی معماری

## ADR-005: Financial Offline Operations — ممنوع

**تصمیم:** هیچ عملیات مالی Offline Queue نمی‌شود

**ممنوع:** Buy, Sell, Deposit, Withdrawal, Payment, Installment, Investment, Transfer, Settlement

**مجاز (فقط non-financial):** UI shell، static content، draft، preferences

**قاعده:** Financial state هرگز با offline data به‌عنوان حقیقت نمایش داده نمی‌شود

## ADR-006: Concurrency — PostgreSQL مرجع نهایی

**تصمیم:** `Database Transaction + SELECT FOR UPDATE` مرجع نهایی Financial Integrity

**Redis:** فقط برای distributed coordination — هرگز مرجع نهایی نیست

## ADR-007: Idempotency — Durable در DB

**تصمیم:** `IdempotencyRecord` table در PostgreSQL مرجع نهایی

**Redis:** فقط برای acceleration (short-lived cache)

**Flow:**

1. Request با `Idempotency-Key`
2. Check Redis → hit → return cached
3. Check IdempotencyRecord → exists → return stored
4. Insert (processing) → Execute → Update (completed) → Cache in Redis

## ADR-008: Web + Mobile دو Target

**تصمیم:** Shared Codebase + دو Build Target

```
Shared Codebase (src/)
  ├── Web Target → Next.js SSR (Turbopack)
  └── Mobile Target → Capacitor (Android + iOS)
```

**Auth:**

- Web: httpOnly cookie/session
- Mobile: Secure token storage (Capacitor Preferences)
- هر دو → همان `/api/v1` backend

## ADR-009: PWA — Serwist + Turbopack

**تصمیم:** Serwist از طریق `@serwist/turbopack` + Route Handler

**نتیجه Spike:**

- ✅ `@serwist/turbopack` با Next.js 16.3.3 + Turbopack کار می‌کند
- ✅ Production build موفق — 20 precache entries
- ✅ Service worker از طریق `/serwist/sw.js` تولید می‌شود
- ⚠️ `@serwist/next` (webpack) با Turbopack سازگار نیست — باید از `@serwist/turbopack` استفاده شود
- ⏳ تست Installability، Chrome Android، Safari iOS نیاز به تست روی دستگاه واقعی دارد

**روش:** Route handler در `app/serwist/[path]/route.ts` با `createSerwistRoute`

## ADR-010: Infrastructure V1 — ساده

**تصمیم:**

- Development: Docker Compose
- Production V1: Docker + Reverse Proxy + PostgreSQL + Redis + Object Storage
- Scaling (Swarm/K8s): در فازهای بعدی

## ADR-011: Rate Limits — Configurable

**تصمیم:** Rate limits در `RateLimitConfig` table — قابل تنظیم توسط admin بدون تغییر کد

**پیش‌فرض‌ها (dev only):**

- `api.general`: 100/min per IP
- `otp.send`: 5/hour per mobile
- `auth.login`: 10/hour per mobile
- `trading.execute`: 30/min per user
- `admin.api`: 200/min per admin

## ADR-012: Business Config — PENDING BUSINESS DECISION

**تصمیم:** تمام مقادیر تجاری به‌صورت configurable با پیش‌فرض موقت

| مقدار                 | پیش‌فرض dev  | وضعیت   |
| --------------------- | ------------ | ------- |
| Spread                | 0.5%         | PENDING |
| Trading Fee           | 0.5%         | PENDING |
| Withdrawal Limit      | 50M Rial/day | PENDING |
| Investment Rate       | 15%/year     | PENDING |
| Installment Rate      | 10%/year     | PENDING |
| Referral Commission   | 5%           | PENDING |
| Physical Delivery Min | 100g         | PENDING |
| SMS Provider          | Kavenegar    | PENDING |
| Payment Gateway       | Zarinpal     | PENDING |
| Price API             | ToloChart    | PENDING |

## ADR-013: Next.js 16 — Middleware → Proxy

**تصمیم:** `middleware.ts` به `proxy.ts` تبدیل شد (deprecated در Next.js 16)

## ADR-014: Prisma Client Output

**تصمیم:** Generated client در `src/generated/prisma` (نه `node_modules/.prisma`)

**دلیل:** Turbopack بهتر resolve می‌کند + gitignore شده

## ADR-015: Permanent User Panel Navigation

**تصمیم:** Navigation اصلی User Panel برای همیشه دقیقاً ۵ مقصد با این ترتیب ثابت است:

1. خانه → `/dashboard`
2. معاملات → `/dashboard/trade`
3. دارایی → `/dashboard/assets`
4. قسطی → `/dashboard/installments`
5. پروفایل → `/dashboard/profile`

**قرارداد:**

- این ساختار یک **Permanent Product Navigation Contract** است — ترتیب و تعداد ثابت می‌ماند.
- Desktop (sidebar) و Mobile (bottom navigation) از یک Information Architecture استفاده می‌کنند.
- Source of Truth واحد: `src/config/navigation.ts` — hardcode navigation در کامپوننت‌ها ممنوع.
- اعلان‌ها، پشتیبانی، جستجو و هشدارهای امنیتی nav item جدید نمی‌شوند — از Header، Profile یا Contextual Actions در دسترس‌اند.
- صفحات فرعی (امنیت، نشست‌ها، معرفی، پشتیبانی) زیر `/dashboard/profile/*` قرار دارند.
- هر تغییر آینده در این قرارداد فقط با ADR رسمی جدید مجاز است.

**دلیل:** یک IA ثابت و قابل پیش‌بینی برای محصول مالی؛ جلوگیری از رشد بی‌رویه nav در Phaseهای آینده؛ تست E2E (`Navigation Contract`) از تغییر ناخواسته جلوگیری می‌کند.

## ADR-016: Zar30 Navy Luxury Design Language

**تصمیم:** زبان بصری دائمی زرسی = **«Luxury Private Banking for Gold»**

**فلسفه رنگ (ترتیب اولویت):**

1. **Navy → Primary/Dominant** — Canvas اصلی همه UI
2. **Gold → Luxury Accent/Action** — CTA، nav فعال، متریک‌های مهم، قیمت، focus
3. **Cream → Supporting Accent** — فقط text روی navy، highlight، warmth — دیگر رنگ اصلی UI نیست
4. **Neutral → Text/Border/Secondary Surfaces**

**قواعد کلیدی:**

- **Dark/Navy-first:** حالت اصلی برند dark/navy است — نه سیاه ساده؛ لایه‌های navy (`navy-950…600`) برای background، sidebar، card، elevated، modal، input. Light Mode فقط opt-in با کلاس `.light` و همچنان navy-primary.
- **Gold کنترل‌شده:** نه همه‌جا؛ بدون glow شدید و gradient سراسری. Gold gradient فقط CTA/Hero/highlight مهم.
- **Glassmorphism** فقط navy-glass + gold border — نه سفید/یخی.
- **Cards:** navy surface + subtle border + gold accent محدود — نه سفید، نه SaaS-like.
- **Buttons:** Primary = Gold روی Navy؛ Secondary = Navy/transparent + gold border.
- **Charts:** Gold primary، cream/neutral secondary، green مثبت، red منفی، grid کم‌کنتراست navy.
- **Anti-patterns ممنوع:** white-first، cream-first، rainbow dashboard، neon crypto، excessive glass/glow/gradient، generic Bootstrap/SaaS look.
- **Token-based اجباری:** همه تصمیم‌ها از tokenها (`globals.css`) — hardcode رنگ/style در کامپوننت ممنوع. تغییر بنیادی فقط با ADR.
- **یک زبان برای همه:** User Panel، Admin (denseتر)، Landing، PWA، Android/iOS آینده — همان Navy+Gold+Cream DNA.

**Source of Truth:** `src/app/globals.css` (tokens) + صفحه `/design-system` (preview) — مرجع کامل: `AGENTS.md › PERMANENT ZAR30 DESIGN LANGUAGE`

**دلیل:** ایجاد امضای بصری یکتا برای برند مالی لوکس؛ جلوگیری از رفتهرفته شدن UI به template عمومی در Phaseهای آینده.

## ADR-017: Zar30 Global Rebranding & Technical Namespace Migration

**تصمیم:** هویت دائمی محصول = **زرسی / zar30 / zar30.com** — مهاجرت سراسری namespace از برند LEGACY (زرنما/Zarnama/zarnama.ir) شامل UI، کد، Auth/JWT/cookies، env، Docker، PWA، Capacitor/Android، SEO و مستندات. Forward-only، بدون تغییر Business Logic.

**سند کامل:** `docs/architecture/ADR-ZAR30-GLOBAL-REBRANDING.md` + Audit: `docs/rebranding/ZAR30-REBRAND-AUDIT.md`

**قانون:** Agentهای آینده حق استفاده از نام LEGACY را ندارند مگر با برچسب `LEGACY` در مستندات Migration. مرجع اجرایی: `AGENTS.md › PERMANENT BRAND IDENTITY`

## ADR-018: Permanent UI Skills Engineering Workflow

**تصمیم:** `ibelick/ui-skills` به‌عنوان مرجع دائمی و اجباری UI/UX Engineering — snapshot Pin‌شده در `.agent/ui-skills/` @ `aaddae727` (synced 2026-09-20) — داخل Repository و مستقل از سیستم خاص.

**قواعد:**

- قبل از هر UI Task → skill مرتبط از snapshot محلی Load شود (۱ پیش‌فرض، حداکثر ۲، ۳ فقط review وسیع)
- No UI from memory — Design System + Brand Language + skill + کامپوننت‌های موجود اول
- Hierarchy: Product Decisions → Design Language → Design Tokens → Components → UI Skills → Feature UI
- UI Skills هرگز Brand Language یا Navigation Contract (ADR-015) را override نمی‌کند — overrideها در `docs/UI_SKILLS.md`
- Upstream تغییر نمی‌کند؛ update فقط با workflow مستند (check → review → repin → regression → docs)
- Source of Truth: `docs/UI_SKILLS.md` + `AGENTS.md › PERMANENT UI ENGINEERING RULE`

**دلیل:** کیفیت UI قابل‌تکرار و مبتنی بر مرجع مهندسی — نه سلیقه لحظه‌ای agent؛ reproducibility با pin؛ استقلال از ابزار خاص.

## ADR-019: Full User Panel Redesign (Premium Private Banking)

**تصمیم:** بازطراحی کامل UX/UI پنل کاربری روی اسکلت Phase 3.1 — بدون تغییر Business Logic و بدون شکستن Navigation Contract (ADR-015).

**اجزای کلیدی:**

- **Wealth Hero** (`wealth-hero.tsx`): سطح ممتاز `.surface-wealth` — Navy لایه‌ای + halo طلایی کنترل‌شده + `gold-rings` تزئینی؛ عدد شاخص «ارزش کل دارایی» + تفکیک طلا/ریال.
- **PanelShell:** سایدبار با eyebrow «پنل کاربری»، آیتم‌های nav با گرادیان طلایی active + نشانگر نوار طلایی؛ کارت کاربر → پروفایل؛ Header با عنوان صفحه context-aware + تاریخ + آواتار + bell؛ Bottom Nav با pill فعال. انتقال صفحه با `animate-page-in` (key={pathname}).
- **Sessions:** دسکتاپ = جدول داده premium (thead معنایی) — موبایل = کارت تعاملی. خلاصه «نشست جاری» همیشه‌نمایان در header کارت.
- **Notifications:** فیلتر tablist «همه / خوانده‌نشده» + آیکون دسته‌بندی بر اساس نوع.
- **Profile:** Identity Header با آواتار halo طلایی + badgeهای وضعیت — hub بخش‌ها حفظ شد.
- **Security:** Overview Strip با وضعیت OTP/2FA + بخش‌ها.
- **Referral:** کد + لینک دعوت (`zar30.com/register?ref=`) + آمار پیش‌نمایش (بدون داده مالی جعلی).
- **Support:** پایه Help Center — ۴ دسته موضوعی → `/faq`.
- **Tokens:** `--shadow-glow` + `.surface-wealth` + `.gold-rings` + `animate-page-in` در `globals.css`.

**قواعد مهارتی اعمال‌شده:** `baseline-ui` + `fixing-accessibility` (ul/li nav، tablist، th scope، aria-current) + `fixing-motion-performance` (فقط transform/opacity، بدون layout animation، blur یک‌باره کوچک، reduced-motion). UI Skills هرگز قرارداد ۵‌آیتمی را تغییر نداد.

**دلیل:** خروج از ظاهر «کارت‌های پشت سر هم» به تجربه Premium Private Banking؛ آماده‌سازی بستر UI برای Phase 4 (KYC).

## تصمیم‌های معلق (DECISION REQUIRED)

- [ ] تایید نتایج PWA Spike روی دستگاه واقعی (Chrome Android, Safari iOS)
- [ ] در صورت fail شدن Serwist → جایگزین (Workbox/custom SW)
- [ ] انتخاب Providerهای Production (SMS, Payment, Price API)
- [ ] نرخ‌های دقیق تجاری (Spread, Fee, Interest, ...)
