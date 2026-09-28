-- CreateEnum
CREATE TYPE "ZareesiCardColor" AS ENUM ('GOLD', 'NAVY', 'CREAM');

-- CreateEnum
CREATE TYPE "ZareesiCardStatus" AS ENUM ('PENDING', 'APPROVED', 'PRODUCTION', 'SHIPPED', 'ACTIVE', 'REJECTED', 'BLOCKED');

-- CreateTable
CREATE TABLE "zareesi_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "color" "ZareesiCardColor" NOT NULL,
    "status" "ZareesiCardStatus" NOT NULL DEFAULT 'PENDING',
    "card_number" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "delivery_address_id" TEXT,
    "shipping_method" TEXT NOT NULL DEFAULT 'POST',
    "fee_gold" DECIMAL(18,8) NOT NULL,
    "fee_toman" BIGINT NOT NULL DEFAULT 0,
    "activated_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "tracking_code" TEXT,
    "admin_note" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zareesi_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zareesi_cards_card_number_key" ON "zareesi_cards"("card_number");

-- CreateIndex
CREATE INDEX "zareesi_cards_user_id_status_idx" ON "zareesi_cards"("user_id", "status");

-- CreateIndex
CREATE INDEX "zareesi_cards_status_idx" ON "zareesi_cards"("status");

-- AddForeignKey
ALTER TABLE "zareesi_cards" ADD CONSTRAINT "zareesi_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zareesi_cards" ADD CONSTRAINT "zareesi_cards_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zareesi_cards" ADD CONSTRAINT "zareesi_cards_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
