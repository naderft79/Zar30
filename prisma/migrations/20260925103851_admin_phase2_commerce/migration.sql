-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('COIN', 'BAR', 'JEWELRY');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountAppliesTo" AS ENUM ('TRADE_FEE', 'COIN_PREMIUM', 'SHOP');

-- CreateEnum
CREATE TYPE "FeeRuleKind" AS ENUM ('KYC_LEVEL', 'VOLUME');

-- CreateEnum
CREATE TYPE "LimitScope" AS ENUM ('WITHDRAW', 'TRADE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "LimitPeriod" AS ENUM ('DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT,
    "kind" "ProductKind" NOT NULL,
    "weight_grams" DECIMAL(18,6) NOT NULL,
    "premium_toman" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" BIGINT NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_purchase" BIGINT,
    "expires_at" TIMESTAMP(3),
    "applies_to" "DiscountAppliesTo" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FeeRuleKind" NOT NULL,
    "kyc_level" "KycLevel",
    "min_volume_toman" BIGINT,
    "buy_fee_bps" INTEGER NOT NULL,
    "sell_fee_bps" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_fee_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "buy_fee_bps" INTEGER,
    "sell_fee_bps" INTEGER,
    "note" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_fee_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit_rules" (
    "id" TEXT NOT NULL,
    "scope" "LimitScope" NOT NULL,
    "kyc_level" "KycLevel",
    "period" "LimitPeriod" NOT NULL,
    "amount_toman" BIGINT,
    "amount_gold" DECIMAL(18,6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "limit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_level_configs" (
    "id" TEXT NOT NULL,
    "level" "KycLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_active_idx" ON "discount_codes"("active");

-- CreateIndex
CREATE INDEX "fee_rules_kind_active_idx" ON "fee_rules"("kind", "active");

-- CreateIndex
CREATE UNIQUE INDEX "user_fee_overrides_user_id_key" ON "user_fee_overrides"("user_id");

-- CreateIndex
CREATE INDEX "limit_rules_scope_active_idx" ON "limit_rules"("scope", "active");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_level_configs_level_key" ON "kyc_level_configs"("level");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_fee_overrides" ADD CONSTRAINT "user_fee_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
