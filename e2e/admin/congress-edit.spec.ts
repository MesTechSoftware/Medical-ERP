import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Kongre & paket düzenleme/silme.
 *
 * updateCongress · updatePackage (değer değişikliği geçmiş kaydı ETKİLEMEZ) ·
 * deletePackage (kaydı varsa engellenir) · cancelCongress (status=IPTAL, satıcı görmez).
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

/** Yeni bir kongre + paket oluşturur (temiz, kayıtsız). */
async function seedCongress(name: string, packageValueKurus: bigint) {
  const [c] = await query<{ id: string }>(
    `INSERT INTO "Congress" (id, name, "startDate", "endDate", status, "createdAt")
     VALUES (gen_random_uuid()::text, $1, now(), now() + interval '3 days', 'YAYINDA', now())
     RETURNING id`,
    [name]
  );
  const [p] = await query<{ id: string }>(
    `INSERT INTO "CongressPackage" (id, "congressId", name, value)
     VALUES (gen_random_uuid()::text, $1, 'Test Paket', $2)
     RETURNING id`,
    [c.id, packageValueKurus.toString()]
  );
  return { congressId: c.id, packageId: p.id };
}

test("kongre düzenlenebilir (ad ve lokasyon güncellenir)", async ({ page }) => {
  const { congressId } = await seedCongress(`Düzenle ${Date.now()}`, 50000n);

  await page.goto(`/congresses/${congressId}/edit`);
  await page.getByLabel("Kongre Adı").fill("Güncellenmiş Kongre");
  await page.getByLabel("Lokasyon").fill("Bursa");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/congresses$/);

  const [c] = await query<{ name: string; location: string }>(
    `SELECT name, location FROM "Congress" WHERE id = $1`,
    [congressId]
  );
  expect(c.name).toBe("Güncellenmiş Kongre");
  expect(c.location).toBe("Bursa");
});

test("kaydı olmayan paket silinir", async ({ page }) => {
  const { packageId } = await seedCongress(`Sil ${Date.now()}`, 50000n);

  page.on("dialog", (d) => d.accept());
  await page.goto("/congresses");
  await page.locator(`form[data-delete-package="${packageId}"] button`).click();

  await expect
    .poll(async () => {
      const rows = await query(
        `SELECT id FROM "CongressPackage" WHERE id = $1`,
        [packageId]
      );
      return rows.length;
    })
    .toBe(0);
});

test("🔴 paket değeri düzenlenince mevcut kaydın reservedAmount'ı DEĞİŞMEZ", async ({
  page,
}) => {
  const { packageId } = await seedCongress(`Snapshot ${Date.now()}`, 50000n);

  // Bir doktora bu pakete ait rezerve edilmiş bir kayıt oluştur (snapshot 50000).
  const [doctor] = await query<{ id: string }>(
    `SELECT id FROM "Doctor" LIMIT 1`
  );
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE role = 'SELLER' LIMIT 1`
  );
  await query(
    `INSERT INTO "CongressRegistration"
       (id, "packageId", "doctorId", "sellerId", status, "reservedAmount", "requestedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, 'ONAYLANDI', 50000, now())`,
    [packageId, doctor.id, seller.id]
  );

  // Paket değerini 90000'e çıkar.
  await page.goto("/congresses");
  await page
    .locator(`tr:has(form[data-delete-package="${packageId}"]) button:has-text("Düzenle")`)
    .click();
  // Satır içi düzenleme formu; sayfada aynı isimli alanlar olduğu için (Yeni Paket
  // formu) getByLabel yerine forma özgü name-tabanlı seçici kullanılır.
  const editForm = page.locator(`form:has(input[name="packageId"][value="${packageId}"])`);
  await editForm.locator('input[name="value"]').fill("900");
  await editForm.getByRole("button", { name: "Kaydet" }).click();

  // Paket değeri güncellendi.
  await expect
    .poll(async () => {
      const [p] = await query<{ value: string }>(
        `SELECT value::text FROM "CongressPackage" WHERE id = $1`,
        [packageId]
      );
      return p.value;
    })
    .toBe("90000");

  // 🔴 Ama mevcut kaydın reservedAmount'ı ESKİ değerde (snapshot korundu).
  const [reg] = await query<{ reservedAmount: string }>(
    `SELECT "reservedAmount"::text FROM "CongressRegistration" WHERE "packageId" = $1`,
    [packageId]
  );
  expect(reg.reservedAmount).toBe("50000");
});

test("🔴 kaydı olan paket silinemez", async ({ page }) => {
  const { packageId } = await seedCongress(`Silinmez ${Date.now()}`, 50000n);
  const [doctor] = await query<{ id: string }>(`SELECT id FROM "Doctor" LIMIT 1`);
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE role = 'SELLER' LIMIT 1`
  );
  await query(
    `INSERT INTO "CongressRegistration"
       (id, "packageId", "doctorId", "sellerId", status, "reservedAmount", "requestedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, 'ONAYLANDI', 50000, now())`,
    [packageId, doctor.id, seller.id]
  );

  page.on("dialog", (d) => d.accept());
  await page.goto("/congresses");
  await page.locator(`form[data-delete-package="${packageId}"] button`).click();

  await expect(page.getByText(/Kaydı olan paket silinemez/i)).toBeVisible();
  // Paket hâlâ duruyor.
  const rows = await query(
    `SELECT id FROM "CongressPackage" WHERE id = $1`,
    [packageId]
  );
  expect(rows).toHaveLength(1);
});

test("🔴 kongre iptal edilince satıcı onu görmez (status=IPTAL)", async ({
  browser,
}) => {
  const uniqueName = `İptalKongre ${Date.now()}`;
  const { congressId } = await seedCongress(uniqueName, 50000n);

  // Admin iptal eder.
  const adminCtx = await browser.newContext({
    storageState: "playwright/.auth/admin.json",
  });
  const adminPage = await adminCtx.newPage();
  try {
    adminPage.on("dialog", (d) => d.accept());
    await adminPage.goto("/congresses");
    await adminPage
      .locator(`[data-congress-controls="${congressId}"] button:has-text("İptal Et")`)
      .click();
    await expect
      .poll(async () => {
        const [c] = await query<{ status: string }>(
          `SELECT status FROM "Congress" WHERE id = $1`,
          [congressId]
        );
        return c.status;
      })
      .toBe("IPTAL");
  } finally {
    await adminCtx.close();
  }

  // Satıcı /my-congresses'te iptal edilen kongrenin paketini görmemeli.
  const sellerCtx = await browser.newContext({
    storageState: "playwright/.auth/seller.json",
  });
  const sellerPage = await sellerCtx.newPage();
  try {
    await sellerPage.goto("/my-congresses");
    await expect(sellerPage.getByText(uniqueName)).toHaveCount(0);
  } finally {
    await sellerCtx.close();
  }
});
