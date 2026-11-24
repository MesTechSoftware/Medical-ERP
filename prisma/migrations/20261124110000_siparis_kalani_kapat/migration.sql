-- A-3 eki (Paket 4): kalanı kapatma. Kalan = quantity − sevk − closedQuantity.
CREATE TYPE "CloseReason" AS ENUM ('TEDARIK_EDILEMEDI', 'MUSTERI_VAZGECTI', 'DIGER');

ALTER TABLE "Order"
    ADD COLUMN "closedAt" TIMESTAMPTZ(3),
    ADD COLUMN "closedById" TEXT,
    ADD COLUMN "closeReason" "CloseReason",
    ADD COLUMN "closeNote" VARCHAR(200);

ALTER TABLE "OrderItem" ADD COLUMN "closedQuantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD CONSTRAINT "Order_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Kapatılan miktar sipariş miktarını aşamaz; kapatma alanları birlikte dolar, DIGER'de açıklama zorunlu.
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_kapatilan_miktar_check" CHECK ("closedQuantity" >= 0 AND "closedQuantity" <= "quantity");
ALTER TABLE "Order" ADD CONSTRAINT "Order_kapatma_alanlari_check" CHECK (
    ("closedAt" IS NULL AND "closedById" IS NULL AND "closeReason" IS NULL AND "closeNote" IS NULL)
    OR ("closedAt" IS NOT NULL AND "closeReason" IS NOT NULL
        AND ("closeReason" <> 'DIGER' OR length(btrim(coalesce("closeNote", ''))) > 0))
);
