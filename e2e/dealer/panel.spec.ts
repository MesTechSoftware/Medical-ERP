import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz D — bayi paneli.
 *
 * FR-46a bayi yalnız kendi verisini görür/işler · FR-46d TALEP stok/cari
 * ETKİLEMEZ · FR-42 onayda ATOMİK stok + cari · FR-46f bayi doğrudan sipariş
 * veremez · FR-46g pasif bayi login olamaz · RULE-15 bayi prim/kongreye dokunmaz.
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

async function dealerCari(dealerId: string): Promise<bigint> {
  const [row] = await query<{ bakiye: string }>(
    `SELECT (
        COALESCE((SELECT SUM("grossTotal") FROM "DealerShipment"
                   WHERE "dealerId" = $1 AND status = 'ONAYLANDI'), 0)
      - COALESCE((SELECT SUM(amount) FROM "DealerPayment" WHERE "dealerId" = $1), 0)
     )::text AS bakiye`,
    [dealerId]
  );
  return BigInt(row.bakiye);
}

async function stockOf(productId: string): Promise<number> {
  const [row] = await query<{ stock: number }>(
    `SELECT stock FROM "Product" WHERE id = $1`,
    [productId]
  );
  return row.stock;
}

test("bayi paneli açılır ve kendi kodu görünür", async ({ page }) => {
  await page.goto("/bayi");
  await expect(page.getByText("BAYI-001")).toBeVisible();
  await expect(page.getByText("Güncel Borç")).toBeVisible();
});

test("🔴 FR-46d: sevkiyat talebi stok ve cariyi ETKİLEMEZ", async ({ page }) => {
  const [dealer] = await query<{ id: string }>(
    `SELECT id FROM "Dealer" WHERE code = 'BAYI-001'`
  );
  const [price] = await query<{ productId: string }>(
    `SELECT "productId" FROM "DealerPrice" WHERE "dealerId" = $1 LIMIT 1`,
    [dealer.id]
  );
  const stockBefore = await stockOf(price.productId);
  const cariBefore = await dealerCari(dealer.id);

  await page.goto("/bayi/talep");
  await page.locator("#p-1").selectOption(price.productId);
  await page.locator("#q-1").fill("3");
  await page.getByRole("button", { name: "Sevkiyat Talebi Oluştur" }).click();
  await expect(page.getByText(/talebiniz oluşturuldu/i)).toBeVisible();

  // 🔴 TALEP durumu: ne stok ne cari değişmeli.
  expect(await stockOf(price.productId)).toBe(stockBefore);
  expect(await dealerCari(dealer.id)).toBe(cariBefore);

  // Kayıt TALEP durumunda oluşmuş olmalı.
  const [ship] = await query<{ status: string; requestedByUserId: string | null }>(
    `SELECT status, "requestedByUserId" FROM "DealerShipment"
      WHERE "dealerId" = $1 ORDER BY "requestedAt" DESC LIMIT 1`,
    [dealer.id]
  );
  expect(ship.status).toBe("TALEP");
  expect(ship.requestedByUserId).not.toBeNull(); // bayi talebi
});

test("🔴 FR-46a: bayi yalnızca KENDİ fiyat listesini görür", async ({ page }) => {
  const [dealer] = await query<{ id: string }>(
    `SELECT id FROM "Dealer" WHERE code = 'BAYI-001'`
  );
  const mine = await query<{ productId: string }>(
    `SELECT "productId" FROM "DealerPrice" WHERE "dealerId" = $1`,
    [dealer.id]
  );

  await page.goto("/bayi/fiyatlar");
  // Kendi fiyatı tanımlı ürün sayısı kadar satır olmalı (başka bayininki değil).
  const [{ count }] = await query<{ count: string }>(
    `SELECT count(*)::text FROM "DealerPrice" dp
       JOIN "Product" p ON p.id = dp."productId"
      WHERE dp."dealerId" = $1 AND p.status = 'ACTIVE'`,
    [dealer.id]
  );
  expect(mine.length).toBeGreaterThan(0);
  // Sayfada en az kendi ürün sayısı kadar fiyat satırı; başka bayinin ürünü sızmaz.
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(Number(count));
});

test("🔴 FR-46f: bayi admin sayfalarına erişemez", async ({ page }) => {
  // Bayi rolüyle admin dashboard'a gitmeye çalış → kendi paneline yönlenir.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/bayi/);

  await page.goto("/dealers");
  await expect(page).toHaveURL(/\/bayi/);

  // Satıcı paneline de giremez.
  await page.goto("/my-orders");
  await expect(page).toHaveURL(/\/bayi/);
});
