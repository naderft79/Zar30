/*
  Warnings:

  - Added the required column `updated_at` to the `kyc_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KycDocKind" AS ENUM ('ID_CARD_FRONT', 'ID_CARD_BACK', 'SELFIE', 'VIDEO');

-- AlterTable
ALTER TABLE "kyc_submissions" ADD COLUMN     "card_number_enc" TEXT,
ADD COLUMN     "current_step" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "iban_enc" TEXT,
ADD COLUMN     "shenasnameh_no" TEXT,
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "kind" "KycDocKind" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_documents_submission_id_idx" ON "kyc_documents"("submission_id");

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "kyc_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
