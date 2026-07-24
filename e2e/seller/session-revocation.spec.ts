import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { USERS } from "../helpers";

/**
 * BRK-04 regresyon testi.
 *
 * JWT stratejisinde token, giriş anındaki rol/durum SNAPSHOT'ını taşır.
 * Kullanıcı pasifleştirilse bile eski token geçerli kalmaya devam ediyordu —
 * yani "satıcıyı pasifleştir" açık oturumu kesmiyordu. requireSession() artık
 * her istekte kullanıcıyı veritabanından doğruluyor.
 *
 * FR-08 (satıcı pasifleştirme) ve FR-46g (bayi pasifleştirme) buna bağlı.
 *
 * Not: Prisma'nın üretilen client'ı ESM olduğu için Playwright'ın transpiler'ı
 * onu yükleyemiyor; tek bir UPDATE için ham `pg` kullanmak yeterli.
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function setSellerStatus(status: "ACTIVE" | "PASSIVE") {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('UPDATE "User" SET status = $1 WHERE email = $2', [
      status,
      USERS.seller.email,
    ]);
  } finally {
    await client.end();
  }
}

test("pasifleştirilen satıcının açık oturumu bir sonraki istekte kesilir", async ({
  page,
}) => {
  // Oturum geçerliyken sayfa açılıyor (storageState ile giriş yapılmış durumda).
  await page.goto("/my-orders");
  await expect(page).toHaveURL(/\/my-orders/);

  try {
    await setSellerStatus("PASSIVE");

    // Token hâlâ geçerli görünüyor ama kullanıcı artık ACTIVE değil.
    await page.goto("/my-orders");
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await setSellerStatus("ACTIVE");
  }

  // Geri alındıktan sonra tekrar erişebilmeli.
  await page.goto("/my-orders");
  await expect(page).toHaveURL(/\/my-orders/);
});
