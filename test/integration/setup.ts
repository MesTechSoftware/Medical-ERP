import { afterAll, beforeEach } from "vitest";

import { prisma } from "@/lib/db";

// SİGORTA: yanlış veritabanına TRUNCATE atmak geri alınamaz. db.ts'in
// fail-fast deseniyle aynı mantık — sessizce yanlış veritabanına yazmak yok.
const url = process.env.DATABASE_URL ?? "";
if (!url.includes("medikal_itest")) {
  throw new Error(
    "Entegrasyon testleri yalnız medikal_itest'e karşı koşar. " +
      `Görülen DATABASE_URL: ${url || "(tanımsız)"}`
  );
}

// Tablo listesi koşu içinde değişmediği için bir kez hesaplanır.
let truncateSql: string | null = null;

beforeEach(async () => {
  if (truncateSql === null) {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `;

    if (tables.length === 0) {
      throw new Error(
        "public şemasında tablo yok — global-setup'taki migrate deploy çalışmamış olabilir."
      );
    }

    // Tek cümlede TRUNCATE: CASCADE yabancı anahtar sırasını gereksiz kılar,
    // RESTART IDENTITY ise autoincrement sayaçlarını sıfırlar.
    const quoted = tables.map((t) => `"${t.tablename}"`).join(", ");
    truncateSql = `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`;
  }

  await prisma.$executeRawUnsafe(truncateSql);
});

afterAll(async () => {
  await prisma.$disconnect();
});
