-- B-4 eki (01.11.2026): stok hareketi işlemi yapan kullanıcıyı taşır.

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Eski kayıtlar kaynak belgenin sahibinden doldurulur. Sevkiyat sahip taşımaz; 1B-7a öncesi sipariş
-- hareketi ve elle giriş de bilinmez — boş kalır (ekranda "—").
-- doldurma
UPDATE "StockMovement" m SET "createdById" = k."createdById" FROM "ReturnNote" k WHERE m."returnNoteId" = k."id" AND m."createdById" IS NULL;
UPDATE "StockMovement" m SET "createdById" = k."createdById" FROM "ConsignmentIssue" k WHERE m."consignmentIssueId" = k."id" AND m."createdById" IS NULL;
UPDATE "StockMovement" m SET "createdById" = k."createdById" FROM "StockTransfer" k WHERE m."stockTransferId" = k."id" AND m."createdById" IS NULL;
UPDATE "StockMovement" m SET "createdById" = k."createdById" FROM "StockAdjustment" k WHERE m."stockAdjustmentId" = k."id" AND m."createdById" IS NULL;
UPDATE "StockMovement" m SET "createdById" = k."userId" FROM "ImportBatch" k WHERE m."importBatchId" = k."id" AND m."createdById" IS NULL;
