-- CreateEnum
CREATE TYPE "WithdrawalSpeed" AS ENUM ('NORMAL', 'FAST');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('POST', 'PICKUP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferKind" AS ENUM ('TRANSFER', 'GIFT');

-- CreateEnum
CREATE TYPE "AlertDirection" AS ENUM ('ABOVE', 'BELOW');

-- CreateEnum
CREATE TYPE "SipFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "withdrawal_requests" ADD COLUMN     "speed" "WithdrawalSpeed" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "card_pan" TEXT,
    "alias" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "recipient_name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "address" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_delivery_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "grams" DECIMAL(18,6) NOT NULL,
    "method" "DeliveryMethod" NOT NULL DEFAULT 'POST',
    "address_id" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "tracking_code" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gold_delivery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_transfers" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "toman_amount" BIGINT,
    "gold_amount" DECIMAL(18,6),
    "kind" "TransferKind" NOT NULL DEFAULT 'TRANSFER',
    "gift_message" TEXT,
    "journal_entry_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_price" BIGINT NOT NULL,
    "direction" "AlertDirection" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_buy_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "toman_amount" BIGINT NOT NULL,
    "frequency" "SipFrequency" NOT NULL,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "last_order_id" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_buy_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_user_id_iban_key" ON "bank_accounts"("user_id", "iban");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "gold_delivery_requests_user_id_created_at_idx" ON "gold_delivery_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "gold_delivery_requests_status_idx" ON "gold_delivery_requests"("status");

-- CreateIndex
CREATE INDEX "internal_transfers_sender_id_created_at_idx" ON "internal_transfers"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "internal_transfers_recipient_id_created_at_idx" ON "internal_transfers"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "price_alerts_user_id_idx" ON "price_alerts"("user_id");

-- CreateIndex
CREATE INDEX "price_alerts_active_idx" ON "price_alerts"("active");

-- CreateIndex
CREATE INDEX "recurring_buy_plans_user_id_idx" ON "recurring_buy_plans"("user_id");

-- CreateIndex
CREATE INDEX "recurring_buy_plans_active_next_run_at_idx" ON "recurring_buy_plans"("active", "next_run_at");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_delivery_requests" ADD CONSTRAINT "gold_delivery_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_delivery_requests" ADD CONSTRAINT "gold_delivery_requests_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_delivery_requests" ADD CONSTRAINT "gold_delivery_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_transfers" ADD CONSTRAINT "internal_transfers_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_buy_plans" ADD CONSTRAINT "recurring_buy_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
