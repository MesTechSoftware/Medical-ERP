-- A-2 eki (20.10.2026): bedelsiz satır sebebi kapalı katalog; DIGER'de açıklama zorunlu.

-- CreateEnum
CREATE TYPE "FreeReason" AS ENUM ('NUMUNE', 'PROMOSYON', 'MAL_FAZLASI', 'DIGER');

-- AlterTable — sütun yerinde çevrilir (eski serbest metin hiçbir akışta yazılmıyordu).
ALTER TABLE "OrderItem"
    ALTER COLUMN "freeReason" TYPE "FreeReason" USING "freeReason"::"FreeReason",
    ADD COLUMN "freeNote" VARCHAR(200);

-- ─── Elle eklenen kısıtlar (Prisma ifade edemiyor) ───────────────────────────

-- A-2: bedelsiz satır sebep taşır; bedelli satır taşımaz.
ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_bedelsiz_sebep_check"
    CHECK (("isFree" AND "freeReason" IS NOT NULL) OR (NOT "isFree" AND "freeReason" IS NULL AND "freeNote" IS NULL));

-- A-2 eki: DIGER sebebinde açıklama zorunlu.
ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_bedelsiz_diger_aciklama_check"
    CHECK ("freeReason" IS DISTINCT FROM 'DIGER' OR length(btrim(COALESCE("freeNote", ''))) > 0);
