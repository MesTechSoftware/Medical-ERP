import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js dev modunda hot-reload sırasında birden fazla PrismaClient
// oluşmasını engellemek için global singleton kullanıyoruz.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Fail-fast: eskiden DATABASE_URL yoksa sessizce yerel bir SQLite dosyasına
  // düşüyordu. Bu, yanlış veritabanına yazmayı fark edilmez hale getiriyordu.
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL tanımlı değil. .env dosyasını oluşturun (bkz. .env.example)."
    );
  }

  // Prisma 7'de driver adapter zorunludur (şemada `url` desteklenmiyor).
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    // Canlıda `error` loglanmaz: Prisma'nın hata mesajı sorgu, kısıt adı ve `meta` taşır
    // (X-3 §(6)). Teknik hata tek satır olarak `instrumentation.ts`'ten yazılır.
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
