-- A-10-5 (Paket 3): bedelsiz olmayan satırın birim fiyatı sıfırdan büyüktür; bedelsiz satır 0 olabilir.
ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_birim_fiyat_pozitif_check"
    CHECK ("isFree" OR "unitPrice" > 0);
