-- Tasarım 3 D1 — ADR-011 §6: denetim listesi (createdAt, seq) sırasıyla keyset sayfalanır; süzgeç
-- indeksleri (kolon, createdAt, seq). Tarih aralığı indeksin sınırı olur: aralığın konumu ve sayfa
-- derinliği maliyeti değiştirmez. Dashboard aktivite akışı (createdAt) aynı indeksi kullanır.

-- DropIndex
DROP INDEX "AuditLog_actorId_seq_idx";

-- DropIndex
DROP INDEX "AuditLog_module_seq_idx";

-- DropIndex
DROP INDEX "AuditLog_actionType_seq_idx";

-- DropIndex
DROP INDEX "AuditLog_action_seq_idx";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_seq_idx" ON "AuditLog"("actorId", "createdAt", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_seq_idx" ON "AuditLog"("module", "createdAt", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_createdAt_seq_idx" ON "AuditLog"("actionType", "createdAt", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_seq_idx" ON "AuditLog"("action", "createdAt", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_seq_idx" ON "AuditLog"("createdAt", "seq");
