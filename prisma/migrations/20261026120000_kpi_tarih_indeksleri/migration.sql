-- Tasarım 2-5 (ADR-010): KPI sorgularının tarih aralığı süzgeçleri için indeksler.
-- Ciro serisi ve en çok sevk edilenler sevkiyat tarihiyle (Shipment.shippedAt), iade ekseni
-- belge tarihiyle (ReturnNote.createdAt, X-1 §(4)), tahsilat AKTIF + ödeme tarihiyle okunur.
-- (status, paidAt) tek başına status indeksini baş sütunuyla karşılar; o indeks kaldırılır.

-- DropIndex
DROP INDEX "DoctorPayment_status_idx";

-- CreateIndex
CREATE INDEX "DoctorPayment_status_paidAt_idx" ON "DoctorPayment"("status", "paidAt");

-- CreateIndex
CREATE INDEX "ReturnNote_createdAt_idx" ON "ReturnNote"("createdAt");

-- CreateIndex
CREATE INDEX "Shipment_shippedAt_idx" ON "Shipment"("shippedAt");
