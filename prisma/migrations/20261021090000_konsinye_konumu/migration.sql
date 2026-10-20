-- A-4 eki (20.10.2026): her doktorun tek konsinye konumu.

-- AlterTable
ALTER TABLE "StockLocation" ADD COLUMN "doctorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StockLocation_doctorId_key" ON "StockLocation"("doctorId");

-- AddForeignKey
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Elle eklenen kısıtlar (Prisma ifade edemiyor) ───────────────────────────

-- A-4: konsinye konumu bir doktora aittir; depo hiçbir doktora ait değildir.
ALTER TABLE "StockLocation"
    ADD CONSTRAINT "StockLocation_konsinye_doktor_check"
    CHECK (("type" = 'KONSINYE') = ("doctorId" IS NOT NULL));
