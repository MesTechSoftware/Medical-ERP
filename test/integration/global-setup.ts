import { execFileSync } from "node:child_process";

import { ITEST_DATABASE_URL } from "./database-url";

// Koşu başına BİR kez: şemayı entegrasyon veritabanına uygula.
//
// `migrate deploy` seçildi, `migrate reset` değil: reset şemayı düşürüp
// yeniden kurar ve her koşuya saniyeler ekler. İzolasyonu şema değil,
// test başına TRUNCATE sağlıyor (setup.ts).
//
// NOT: prisma.config.ts `dotenv/config` yüklüyor ama dotenv var olan
// ortam değişkenlerini EZMİYOR — bu yüzden DATABASE_URL'i burada geçmek
// .env'deki dev bağlantısını geçersiz kılar.
export function setup() {
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32", // Windows: npx bir .cmd dosyasıdır
    env: { ...process.env, DATABASE_URL: ITEST_DATABASE_URL },
  });
}
