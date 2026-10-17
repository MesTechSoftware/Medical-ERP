import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * X-17-4 — pasifleştirme portföyü bekletmez: doktoru olan satıcı pasifleştirilirken
 * portföy seçimi ve gerekçe zorunludur; "sahipsiz bırak" her doktor için iz satırı yazar.
 * Hedef satıcı e2e'nin giriş yaptığı satıcı değildir (oturum testleri etkilenmez).
 */

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

test("doktoru olan satıcı portföy seçimi olmadan pasifleştirilemez; sahipsiz bırakınca iz yazılır (X-17-4)", async ({
  page,
}) => {
  const [satici] = await query<{ id: string }>(`SELECT id FROM "User" WHERE email = 'mehmet@medikal.local'`);
  const doktorlar = await query<{ id: string }>(`SELECT id FROM "Doctor" WHERE "ownerSellerId" = $1`, [satici.id]);
  expect(doktorlar.length).toBeGreaterThan(0);

  try {
    await page.goto(`/sellers/${satici.id}/edit`);
    await page.locator("#status").selectOption("PASIF");

    // Seçim yok → form kaydedilmez, satıcı aktif kalır.
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(/doktoru var/)).toBeVisible();
    const [hala] = await query<{ isActive: boolean }>(`SELECT "isActive" FROM "User" WHERE id = $1`, [satici.id]);
    expect(hala.isActive).toBe(true);
    // Hata dönüşünde seçimler korunur: form sıfırlanıp durum AKTIF'e dönerse ikinci
    // gönderim satıcıyı sessizce aktif bırakır.
    await expect(page.locator("#status")).toHaveValue("PASIF");

    // Sahipsiz bırak + gerekçe → pasifleşir, doktorlar sahipsiz, her birine iz satırı.
    await page.locator("#portfoy").selectOption("SAHIPSIZ");
    await page.locator("#portfoyGerekce").fill("E2E ayrılış");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/sellers$/);

    const [sonra] = await query<{ isActive: boolean }>(`SELECT "isActive" FROM "User" WHERE id = $1`, [satici.id]);
    expect(sonra.isActive).toBe(false);
    const sahipli = await query(`SELECT id FROM "Doctor" WHERE "ownerSellerId" = $1`, [satici.id]);
    expect(sahipli).toHaveLength(0);
    const izler = await query<{ doctorId: string }>(
      `SELECT "doctorId" FROM "DoctorAssignment" WHERE reason = 'E2E ayrılış' AND "fromSellerId" = $1 AND "toSellerId" IS NULL`,
      [satici.id]
    );
    expect(izler.map((i) => i.doctorId).sort()).toEqual(doktorlar.map((d) => d.id).sort());
  } finally {
    // Seed durumunu geri al (suite sırası bağımsızlığı).
    await query(`UPDATE "User" SET "isActive" = true WHERE id = $1`, [satici.id]);
    for (const d of doktorlar) {
      await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [satici.id, d.id]);
    }
  }
});
