-- Tasarım 2. tur eki D-3 (ADR-010): dashboard aktivite akışı denetim kaydını en yeniden okur
-- (createdAt azalan, ilk 15, olay türü süzgeçli). Mevcut (entityType, createdAt) indeksi tür
-- süzgeci olmadan sıralamayı karşılamaz.

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
