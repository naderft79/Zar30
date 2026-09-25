-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'PREPARING';

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "block_note" TEXT,
ADD COLUMN     "blocked_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "gold_delivery_requests" ADD COLUMN     "fee_toman" BIGINT,
ADD COLUMN     "journal_entry_id" TEXT,
ADD COLUMN     "pickup_at" TIMESTAMP(3),
ADD COLUMN     "pickup_branch" TEXT;

-- AlterTable
ALTER TABLE "internal_transfers" ADD COLUMN     "flag_reason" TEXT,
ADD COLUMN     "flagged_at" TIMESTAMP(3),
ADD COLUMN     "flagged_by" TEXT;

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "gold_delivery_requests" ADD CONSTRAINT "gold_delivery_requests_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
