# Zar30 — Database Documentation

> PostgreSQL 18.x + Prisma 7.10.0 + Double-Entry Ledger

## اتصال

- **ORM:** Prisma 7.10.0 با Driver Adapter (`@prisma/adapter-pg`)
- **Config:** `prisma.config.ts` (نه schema.prisma)
- **Client:** `src/generated/prisma` (generated — gitignored)

## دستورها

```bash
pnpm db:generate   # تولید Prisma Client
pnpm db:migrate    # اجرای migration (نیاز به DB)
pnpm db:push       # push schema بدون migration
pnpm db:seed       # اجرای seed (development)
pnpm db:studio     # Prisma Studio
```

## ساختار مالی (Double-Entry)

```
User
  └── Wallet (container)
        ├── AssetAccount (RIAL) ←── LedgerEntry
        └── AssetAccount (GOLD) ←── LedgerEntry

FinancialTransaction
  └── JournalEntry (balanced: debit = credit)
        ├── LedgerEntry → LedgerAccount (DEBIT)
        └── LedgerEntry → LedgerAccount (CREDIT)
```

### Ledger Accounts (Seeded)

| Code                       | Type      | توضیح              |
| -------------------------- | --------- | ------------------ |
| ASSET_RIAL                 | ASSET     | موجودی ریالی کاربر |
| ASSET_GOLD                 | ASSET     | موجودی طلای کاربر  |
| ASSET_LOCKED_RIAL          | ASSET     | ریال قفل‌شده       |
| ASSET_LOCKED_GOLD          | ASSET     | طلای قفل‌شده       |
| REVENUE_SPREAD             | REVENUE   | درآمد اسپرد        |
| REVENUE_FEE                | REVENUE   | درآمد کارمزد       |
| REVENUE_INSTALLMENT        | REVENUE   | درآمد قسط          |
| REVENUE_WITHDRAWAL         | REVENUE   | کارمزد برداشت      |
| REVENUE_DELIVERY           | REVENUE   | کارمزد تحویل       |
| EXPENSE_OPERATIONAL        | EXPENSE   | هزینه عملیاتی      |
| LIABILITY_GOLD_INVENTORY   | LIABILITY | موجودی طلای پلتفرم |
| LIABILITY_INTEREST_PAYABLE | LIABILITY | سود قابل پرداخت    |
| EQUITY_CAPITAL             | EQUITY    | سرمایه پلتفرم      |

## جداول کلیدی

| جدول                     | توضیح                   |
| ------------------------ | ----------------------- |
| `users`                  | کاربران                 |
| `admin_users`            | ادمین‌ها (RBAC)         |
| `sessions`               | نشست‌ها                 |
| `otp_codes`              | کدهای OTP               |
| `kyc_submissions`        | احراز هویت              |
| `wallets`                | کیف پول (container)     |
| `asset_accounts`         | حساب‌های دارایی         |
| `ledger_accounts`        | حساب‌های دفتری          |
| `journal_entries`        | رویدادهای حسابداری      |
| `ledger_entries`         | رکوردهای debit/credit   |
| `orders`                 | سفارشات خرید/فروش       |
| `transactions`           | تراکنش‌ها               |
| `withdrawal_requests`    | درخواست‌های برداشت      |
| `gold_prices`            | قیمت‌های طلا            |
| `idempotency_records`    | رکوردهای idempotency    |
| `rate_limit_configs`     | تنظیمات rate limit      |
| `notifications`          | اعلان‌ها                |
| `notification_templates` | قالب‌های اعلان          |
| `tickets`                | تیکت‌ها                 |
| `ticket_messages`        | پیام‌های تیکت           |
| `referrals`              | دعوت‌ها                 |
| `installment_plans`      | طرح‌های قسطی            |
| `installment_contracts`  | قراردادهای قسطی         |
| `installment_payments`   | اقساط                   |
| `investment_plans`       | طرح‌های سرمایه‌گذاری    |
| `investment_positions`   | موقعیت‌های سرمایه‌گذاری |
| `interest_payouts`       | پرداخت‌های سود          |
| `audit_logs`             | لاگ‌های ممیزی           |
| `cms_contents`           | محتوای CMS              |
| `feature_flags`          | فلگ‌های ویژگی           |

## Migration

- `prisma/migrations/20251218000000_init/migration.sql` — اولین migration
- `prisma/migrations/migration_lock.toml` — provider = postgresql

## قواعد مالی

1. هر JournalEntry باید balanced باشد
2. LedgerEntry immutable — اصلاح فقط با Reversal
3. PostgreSQL مرجع نهایی — Redis هرگز مرجع نیست
4. Idempotency در DB — Redis فقط acceleration
5. Row-level locking با SELECT FOR UPDATE
