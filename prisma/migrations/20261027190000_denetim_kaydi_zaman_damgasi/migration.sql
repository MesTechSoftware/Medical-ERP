-- Tasarım 3 D1 — ADR-011 §6: denetim kaydının zamanı uygulamanın saatiyle yazılır (Prisma `now()`),
-- diğer tablolarla aynı saat. Veritabanı saati (`clock_timestamp()`) uygulamanınkinden geride
-- kalabiliyor; demo geçmişi kaydırması `simdi()`'yle karşılaştırdığı için satır kaçırıyordu.

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
