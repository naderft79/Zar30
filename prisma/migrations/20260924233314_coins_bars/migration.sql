-- CreateTable
CREATE TABLE "coin_products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "weight_grams" DECIMAL(18,8) NOT NULL,
    "premium_toman" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_products_code_key" ON "coin_products"("code");

-- CreateIndex
CREATE INDEX "coin_holdings_user_id_idx" ON "coin_holdings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coin_holdings_user_id_product_id_key" ON "coin_holdings"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "coin_holdings" ADD CONSTRAINT "coin_holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_holdings" ADD CONSTRAINT "coin_holdings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "coin_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
