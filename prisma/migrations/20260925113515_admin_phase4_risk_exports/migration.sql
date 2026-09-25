-- CreateEnum
CREATE TYPE "RiskMetric" AS ENUM ('WITHDRAW_SUM', 'TRADE_SUM', 'TRANSFER_COUNT', 'TRANSFER_GOLD', 'FAILED_PAYMENTS', 'FLAGGED_TRANSFERS', 'BLOCKED_CARDS', 'LOGIN_IP_CHANGES');

-- CreateTable
CREATE TABLE "risk_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" "RiskMetric" NOT NULL,
    "threshold" DECIMAL(20,4) NOT NULL,
    "window_hours" INTEGER NOT NULL DEFAULT 24,
    "score_weight" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "metric" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "detail" JSONB,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_records" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "params" JSONB,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_rules_active_idx" ON "risk_rules"("active");

-- CreateIndex
CREATE INDEX "risk_events_user_id_created_at_idx" ON "risk_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "risk_events_reviewed_at_idx" ON "risk_events"("reviewed_at");

-- CreateIndex
CREATE INDEX "export_records_admin_id_created_at_idx" ON "export_records"("admin_id", "created_at");

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "risk_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_records" ADD CONSTRAINT "export_records_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
