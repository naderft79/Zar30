-- AlterTable
ALTER TABLE "recurring_buy_plans" ADD COLUMN     "consecutive_failures" INTEGER NOT NULL DEFAULT 0;
