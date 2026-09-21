-- ============================================
-- Zar30 - Toman Native Migration + Payments
-- ============================================
-- واحد پول داخلی از این پس فقط «تومان» است.
-- قانون داده: از هر مقدار پولی ذخیره‌شده دقیقاً یک صفر کم می‌شود.
-- مقادیر طلا (گرم) اصلاً دست نمی‌خورند.
-- داده‌های غیرقابل‌تقسیم که artifact تست/seed هستند پاک یا normalize می‌شوند.
-- ============================================

-- ---------- 0) پاکسازی artifactهای تست غیرقابل‌تبدیل ----------
-- این رکوردها داده مصنوعی تست‌های قدیمی dev هستند (unit_price=6666666،
-- planهای TEST-* و legهای ledger با مقدار 5000001) و واحد قابل‌حذف‌صفر ندارند.

-- سفارش‌های artifact و اسناد مرتبطشان
DELETE FROM ledger_entries WHERE journal_entry_id IN (
  SELECT journal_entry_id FROM orders WHERE journal_entry_id IS NOT NULL AND mod(unit_price,10) != 0);
DELETE FROM journal_entries WHERE id IN (
  SELECT journal_entry_id FROM orders WHERE journal_entry_id IS NOT NULL AND mod(unit_price,10) != 0);
DELETE FROM orders WHERE mod(unit_price,10) != 0 OR mod(rial_amount,10) != 0 OR mod(fee,10) != 0 OR mod(total,10) != 0;

-- اسناد artifact با leg ریالی غیرقابل‌تقسیم (باقی‌مانده تست‌های قدیمی)
-- جدول کمکی واقعی (migrate هر statement را جدا اجرا می‌کند — TEMP کار نمی‌کند)
CREATE TABLE IF NOT EXISTS _bad_journals AS
  SELECT DISTINCT journal_entry_id AS id FROM ledger_entries WHERE mod("amountRial",10) != 0;
DELETE FROM orders WHERE journal_entry_id IN (SELECT id FROM _bad_journals);
DELETE FROM transactions WHERE journal_entry_id IN (SELECT id FROM _bad_journals);
DELETE FROM withdrawal_requests WHERE journal_entry_id IN (SELECT id FROM _bad_journals);
DELETE FROM ledger_entries WHERE journal_entry_id IN (SELECT id FROM _bad_journals);
DELETE FROM journal_entries WHERE reversal_of IN (SELECT id FROM _bad_journals);
DELETE FROM journal_entries WHERE id IN (SELECT id FROM _bad_journals);
DROP TABLE IF EXISTS _bad_journals;

-- قراردادهای اقساطی artifact (قبل از planها به‌خاطر FK)
DELETE FROM installment_payments WHERE contract_id IN (
  SELECT id FROM installment_contracts WHERE mod(principal,10) != 0 OR mod(down_payment,10) != 0 OR mod(total_payable,10) != 0);
DELETE FROM installment_contracts WHERE mod(principal,10) != 0 OR mod(down_payment,10) != 0 OR mod(total_payable,10) != 0;
DELETE FROM installment_payments WHERE mod(amount,10) != 0 OR mod(late_fee,10) != 0;
DELETE FROM installment_contracts WHERE plan_id IN (SELECT id FROM installment_plans WHERE name LIKE 'TEST-%');
DELETE FROM installment_plans WHERE name LIKE 'TEST-%' OR mod(min_amount,10) != 0 OR mod(max_amount,10) != 0;

-- ---------- 1) تغییر نام enum ----------
ALTER TYPE "AssetType" RENAME VALUE 'RIAL' TO 'TOMAN';

-- ---------- 2) تغییر نام ستون‌ها (داده حفظ می‌شود) ----------
ALTER TABLE "ledger_entries" RENAME COLUMN "amountRial" TO "amount_toman";
ALTER TABLE "orders" RENAME COLUMN "rial_amount" TO "toman_amount";

-- ---------- 3) کدهای حساب دفتر کل ----------
UPDATE "ledger_accounts" SET code='ASSET_TOMAN' WHERE code='ASSET_RIAL';
UPDATE "ledger_accounts" SET code='ASSET_LOCKED_TOMAN' WHERE code='ASSET_LOCKED_RIAL';
UPDATE "ledger_accounts" SET code='ASSET_PLATFORM_TOMAN' WHERE code='ASSET_PLATFORM_RIAL';
UPDATE "ledger_accounts" SET code='LIABILITY_USER_TOMAN' WHERE code='LIABILITY_USER_RIAL';
UPDATE "ledger_accounts" SET name=REPLACE(name,'ریال','تومان') WHERE name LIKE '%ریال%';

-- ---------- 4) حذف دقیقاً یک صفر از مقادیر پولی ----------
-- حساب‌های دارایی تومانی (طلا دست‌نخورده). trunc تعیین‌گرا است —
-- برای seed fixtureهای غیراستاندارد مانند 9999999999.99999999 → 999999999.99999999
UPDATE "asset_accounts" SET balance = trunc(balance/10, 8) WHERE asset_type='TOMAN';
UPDATE "asset_accounts" SET locked_balance = trunc(locked_balance/10, 8) WHERE asset_type='TOMAN';

-- Ledger entries — مبالغ تومانی؛ balance_after فقط روی legهای حساب تومانی
UPDATE "ledger_entries" SET "amount_toman" = "amount_toman"/10 WHERE "amount_toman" IS NOT NULL;
UPDATE "ledger_entries" le SET balance_after = trunc(le.balance_after/10, 8)
  FROM "ledger_accounts" la
  WHERE la.id = le.ledger_account_id
    AND la.code IN ('ASSET_TOMAN','ASSET_LOCKED_TOMAN')
    AND le.balance_after IS NOT NULL;

-- سفارش‌ها، تراکنش‌ها، برداشت‌ها، قیمت‌ها، اقساط
UPDATE "orders" SET toman_amount=toman_amount/10, unit_price=unit_price/10, fee=fee/10, total=total/10;
UPDATE "transactions" SET amount=amount/10;
UPDATE "withdrawal_requests" SET amount=amount/10;
UPDATE "gold_prices" SET buy_price=buy_price/10, sell_price=sell_price/10, raw_price=raw_price/10;
UPDATE "installment_plans" SET min_amount=min_amount/10, max_amount=max_amount/10;
UPDATE "installment_contracts" SET principal=principal/10, down_payment=down_payment/10, total_payable=total_payable/10;
UPDATE "installment_payments" SET amount=amount/10, late_fee=late_fee/10;

-- پاداش referral — فقط در صورت مشخص‌بودن نوع پولی؛ reward_type تهی = طلا → دست نمی‌خورد
UPDATE "referrals" SET reward_amount = trunc(reward_amount/10, 8)
  WHERE reward_type = 'TOMAN' AND reward_amount IS NOT NULL;

-- ---------- 5) جدول پرداخت ----------
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "gateway" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "authority" TEXT,
    "ref_id" TEXT,
    "card_pan" TEXT,
    "description" TEXT,
    "failure_reason" TEXT,
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");
CREATE UNIQUE INDEX "payments_authority_key" ON "payments"("authority");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");
CREATE INDEX "payments_status_idx" ON "payments"("status");

ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
