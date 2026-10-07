import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { referansVeriYukle } from "./referans";

// `db:seed` — yalnız REFERANS veri (C9). Canlıda da çalışır; hiçbir şey silmez.
// Demo verisi `db:seed:demo`'dadır (prisma/seed-demo.ts).

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil (bkz. .env.example).");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

referansVeriYukle(prisma)
  .then(({ uyarilar }) => {
    for (const u of uyarilar) console.warn(`⚠️  ${u}`);
    console.log("Referans veri hazır.");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
