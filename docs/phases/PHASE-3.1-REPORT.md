# PHASE 3.1 REPORT — Navigation Lock & Premium UI/UX Redesign

**تاریخ:** 2026-09-19 | **وضعیت:** ✅ DONE

## ۱. Navigation نهایی (قرارداد دائمی — ADR-015)

دقیقاً ۵ مقصد با ترتیب ثابت — source of truth: `src/config/navigation.ts`

| #   | label   | مسیر                      | محتوای بخش                                                                    |
| --- | ------- | ------------------------- | ----------------------------------------------------------------------------- |
| ۱   | خانه    | `/dashboard`              | خلاصه حساب، KYC، دارایی، معاملات، اعلان‌ها، اقدام سریع، قسطی، referral، امنیت |
| ۲   | معاملات | `/dashboard/trade`        | خرید/فروش طلا، قیمت لحظه‌ای، سفارش‌ها، تاریخچه، quote                         |
| ۳   | دارایی  | `/dashboard/assets`       | موجودی طلا/ریال، کیف پول، سود و زیان، تراکنش‌ها، واریز/برداشت                 |
| ۴   | قسطی    | `/dashboard/installments` | طرح‌ها، قرارداد، اقساط، سررسید، پرداخت، تاریخچه                               |
| ۵   | پروفایل | `/dashboard/profile`      | اطلاعات، KYC، امنیت، نشست‌ها، رمز، اعلان‌ها، referral، پشتیبانی، legal        |

- Desktop: premium sidebar (navy) — Mobile: bottom navigation با safe-area — هر دو از یک config.
- اعلان‌ها/پشتیبانی/جستجو nav item نیستند → header bell + profile hub.
- `isNavItemActive`: `/dashboard` دقیق، بقیه prefix match (زیرمسیرهای پروفایل فعال می‌شوند).

## ۲. Design System

- **Token-based کامل** در `globals.css` — هیچ رنگ/سایه hardcode در کامپوننت‌ها
- **رنگ‌ها:** Deep Navy (primary)، Rich Gold (secondary/CTA)، Cream/Warm White (surface)، Charcoal Navy (dark surfaces)، Financial Green، Warm Amber، Controlled Red، text primary/secondary/muted
- **Dark Mode چندلایه:** app background → sidebar → card → elevated card → modal → input (عمق واقعی، نه `#000` ساده)
- **Typography:** Display / H1 / H2 / H3 / Body / Caption / Financial Number — سلسله‌مراتب واضح برای اعداد مالی
- **Radius/Shadow/Spacing/Motion/Z-index/Breakpoint** همه توکن‌دار + `prefers-reduced-motion`

## ۳. کامپوننت‌های جدید

**Financial** (`src/components/financial/`): `FinancialNumber` (count-up امن — مقدار واقعی هرگز مبهم نمی‌شود)، `BalanceCard`، `PriceTicker`، `TransactionItem`، `OrderCard`، `QuoteCard`، `PortfolioChart`، `StatusCard`، `TrendBadge`

**UI** (`src/components/ui/`): Button با `gold`/`success` + stateها، `Skeleton` shimmer، `EmptyState`، `ErrorState`، `StatusBadge`، `DataTable` responsive (جدول دسکتاپ → کارت موبایل)

**Panel:** `PageHeader` — فرمت متمرکز: `src/lib/utils/format.ts`

## ۴. صفحات

- **Dashboard:** Header → Greeting → Financial Summary → Quick Actions → Asset Overview → Market → Recent Activity → Installment → Security/KYC
- **Trade/Assets/Installments:** صفحات preview با EmptyState اختصاصی — بدون financial logic
- **Profile hub** + زیرمسیرها؛ مسیرهای قدیمی (`/dashboard/security` و...) redirect
- **`/design-system`** — preview همه کامپوننت‌ها

## ۵. Responsive / RTL / Accessibility

- Bottom nav موبایل با `safe-area-inset-bottom`؛ sidebar فقط ≥768px
- RTL کامل: آیکن، chevron، spacing، تراز اعداد، ترکیب فارسی/انگلیسی
- `h1` در همه صفحات (۵ صفحه auth اصلاح شدند)، landmarkها، `aria-current="page"` روی nav فعال، label فرم‌ها، focus ring

## ۶. تست‌ها

| مورد                             | نتیجه                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm lint`                      | ✅ 0 errors / 0 warnings                                                                   |
| `pnpm typecheck`                 | ✅ 0 errors                                                                                |
| `pnpm test` (unit + integration) | ✅ 73/73                                                                                   |
| `pnpm test:e2e`                  | ✅ ۵۹ pass / ۱ skip روی ۳ viewport — شامل Navigation Contract (۲ تست) + a11y smoke (۳ تست) |
| `pnpm build`                     | ✅ ۵۴ route + Serwist                                                                      |

**پایدارسازی E2E:** bcryptjs با cost ۱۲ زیر بار موازی سرور تست را کرش می‌کرد → `BCRYPT_COST=10` فقط برای e2e در `playwright.config.ts` + `workers: 4` + `retries: 1`. مقدار production در `.env` همان ۱۲ باقی است.

## ۷. Documentation

- `AGENTS.md` — بخش «PERMANENT USER NAVIGATION» + «DESIGN SYSTEM»
- `MEGAPLAN.md` — IA + Navigation Patterns + Design System ارتقایافته
- `docs/ARCHITECTURE_DECISIONS.md` — ADR-015
- `docs/EXECUTION_STATUS.md` + `docs/CHANGELOG.md`

## ۸. مشکلات شناخته‌شده

- Build warning: `SMS_PROVIDER=kavenegar` برای production لازم است (فعلاً mock dev)
- Node `url.parse()` deprecation (از dependencyها)
- Push قبلی (`6e5e4c7`) با TLS EOF ناموفق — با این commit دوباره تلاش می‌شود

## ۹. مرز Phase

هیچ financial logic جدیدی ساخته نشد — همه صفحات مالی preview/empty هستند.
