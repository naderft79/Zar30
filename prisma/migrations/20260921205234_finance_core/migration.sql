-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "withdrawal_requests" ADD COLUMN     "journal_entry_id" TEXT,
ADD COLUMN     "review_note" TEXT;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
