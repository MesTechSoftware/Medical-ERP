import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz D — admin tarafı bayi yönetimi.
 *
 * FR-42 onayda ATOMİK stok + cari · FR-43 stok yetersizse red · FR-44 iptalde
 * stok geri + cari geri · FR-46g pasif bayi login olamaz ·
 * 🔴 RULE-15 bayi sevkiyatı prim/kongreye HİÇ dokunmaz.
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

/** BAYI-001 için bir TALEP kaydı kurar, kalem bilgisini döndürür. */
async function seedRequest(quantity: number) {
  const [dealer] = await query<{ id: string }>(
    `SELECT id FROM "Dealer" WHERE code = 'BAYI-001'`
  );
  const [price] = await query<{
    productId: string;
    netPrice: string;
    vatRate: number;
  }>(
    `SELECT "productId", "netPrice"::text, "vatRate" FROM "DealerPrice"
      WHERE "dealerId" = $1 LIMIT 1`,
    [dealer.id]
  );
  const net = BigInt(price.netPrice) * BigInt(quantity);
  const vat = (net * BigInt(price.vatRate)) / 100n;
  const gross = net + vat;

  const [ship] = await query<{ id: string }>(
    `INSERT INTO "DealerShipment"
       (id, "dealerId", status, "netTotal", "vatTotal", "grossTotal", "requestedAt")
     VALUES (gen_random_uuid()::text, $1, 'TALEP', $2, $3, $4, now())
     RETURNING id`,
    [dealer.id, net.toString(), vat.toString(), gross.toString()]
  );
  await query(
    `INSERT INTO "DealerShipmentItem"
       (id, "shipmentId", "productId", quantity, "netUnitPrice", "vatRate",
        "vatAmount", "lineNetTotal", "lineGrossTotal")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      ship.id,
      price.productId,
      quantity,
      price.netPrice,
      price.vatRate,
      vat.toString(),
      net.toString(),
      gross.toString(),
    ]
  );
  return { dealerId: dealer.id, shipmentId: ship.id, productId: price.productId, gross };
}

test("🔴 FR-42: onayda stok ATOMİK düşer ve cariye yazılır", async ({ page }) => {
  const { dealerId, shipmentId, productId, gross } = await seedRequest(4);
  const stockBefore = await stockOf(productId);
  const cariBefore = await dealerCari(dealerId);

  await page.goto("/dealer-shipments");
  await page.locator(`form[data-approve="${shipmentId}"] button`).click();

  await expect
    .poll(async () => {
      const [s] = await query<{ status: string }>(
        `SELECT status FROM "DealerShipment" WHERE id = $1`,
        [shipmentId]
      );
      return s.status;
    })
    .toBe("ONAYLANDI");

  // Stok 4 düştü, cari brüt tutar kadar arttı.
  expect(await stockOf(productId)).toBe(stockBefore - 4);
  expect(await dealerCari(dealerId)).toBe(cariBefore + gross);

  // OUT hareketi yazıldı.
  const moves = await query(
    `SELECT id FROM "StockMovement" WHERE "dealerShipmentId" = $1 AND type = 'OUT'`,
    [shipmentId]
  );
  expect(moves.length).toBeGreaterThan(0);
});

test("🔴 FR-44: onaylı sevkiyat iptalinde stok geri gelir, cari geri alınır", async ({
  page,
}) => {
  const { dealerId, shipmentId, productId, gross } = await seedRequest(2);

  // Önce onayla.
  await page.goto("/dealer-shipments");
  await page.locator(`form[data-approve="${shipmentId}"] button`).click();
  await expect
    .poll(async () => {
      const [s] = await query<{ status: string }>(
        `SELECT status FROM "DealerShipment" WHERE id = $1`,
        [shipmentId]
      );
      return s.status;
    })
    .toBe("ONAYLANDI");

  const stockAfterApprove = await stockOf(productId);
  const cariAfterApprove = await dealerCari(dealerId);

  // Şimdi iptal et.
  await page.reload();
  await page.locator(`form[data-cancel="${shipmentId}"] button`).click();
  await expect
    .poll(async () => {
      const [s] = await query<{ status: string }>(
        `SELECT status FROM "DealerShipment" WHERE id = $1`,
        [shipmentId]
      );
      return s.status;
    })
    .toBe("IPTAL");

  // Stok geri geldi (2 IN), cari borç geri alındı.
  expect(await stockOf(productId)).toBe(stockAfterApprove + 2);
  expect(await dealerCari(dealerId)).toBe(cariAfterApprove - gross);
});

test("🔴 FR-43: stok yetersizse onay reddedilir (transaction geri alınır)", async ({
  page,
}) => {
  const { dealerId, shipmentId, productId, gross } = await seedRequest(1);

  // Ürün stoğunu sıfırla.
  await query(`UPDATE "Product" SET stock = 0 WHERE id = $1`, [productId]);
  const cariBefore = await dealerCari(dealerId);

  await page.goto("/dealer-shipments");
  await page.locator(`form[data-approve="${shipmentId}"] button`).click();

  // Onay başarısız: durum TALEP kalmalı, cari değişmemeli, stok negatife düşmemeli.
  await expect(page.getByText(/yeterli stok yok/i)).toBeVisible();
  const [s] = await query<{ status: string }>(
    `SELECT status FROM "DealerShipment" WHERE id = $1`,
    [shipmentId]
  );
  expect(s.status).toBe("TALEP");
  expect(await dealerCari(dealerId)).toBe(cariBefore);
  expect(await stockOf(productId)).toBe(0);

  // temizlik: stoğu geri yükle
  await query(`UPDATE "Product" SET stock = 100 WHERE id = $1`, [productId]);
  void gross;
});

test("🔴 RULE-15: bayi sevkiyatı prim ve kongreye HİÇ dokunmaz", async ({
  page,
}) => {
  const { dealerId, shipmentId } = await seedRequest(3);

  // Onay öncesi prim matrahı ve kongre hareket sayısı.
  const [{ ledgerBefore }] = await query<{ ledgerBefore: string }>(
    `SELECT count(*)::text AS "ledgerBefore" FROM "CongressLedger"`
  );
  const [{ allocBefore }] = await query<{ allocBefore: string }>(
    `SELECT count(*)::text AS "allocBefore" FROM "PaymentAllocation"`
  );

  await page.goto("/dealer-shipments");
  await page.locator(`form[data-approve="${shipmentId}"] button`).click();
  await expect
    .poll(async () => {
      const [s] = await query<{ status: string }>(
        `SELECT status FROM "DealerShipment" WHERE id = $1`,
        [shipmentId]
      );
      return s.status;
    })
    .toBe("ONAYLANDI");

  // Kongre defteri ve prim mahsupları AYNEN durmalı (bayi bunlara dokunmaz).
  const [{ ledgerAfter }] = await query<{ ledgerAfter: string }>(
    `SELECT count(*)::text AS "ledgerAfter" FROM "CongressLedger"`
  );
  const [{ allocAfter }] = await query<{ allocAfter: string }>(
    `SELECT count(*)::text AS "allocAfter" FROM "PaymentAllocation"`
  );
  expect(ledgerAfter).toBe(ledgerBefore);
  expect(allocAfter).toBe(allocBefore);

  // Ayrıca bu bayinin hiçbir CommissionPeriod/CongressRegistration'ı olamaz.
  void dealerId;
});

test("🔴 FR-46g: pasifleştirilen bayi login olamaz", async ({ browser }) => {
  // Bayiyi pasifleştir (login user'ı da pasife alınır).
  await query(
    `UPDATE "User" SET status = 'PASSIVE' WHERE email = 'bayi@medikal.local'`
  );
  await query(
    `UPDATE "Dealer" SET status = 'PASSIVE' WHERE code = 'BAYI-001'`
  );

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto("/login");
    await page.getByLabel("E-posta").fill("bayi@medikal.local");
    await page.getByLabel("Şifre").fill("bayi123");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    // Pasif kullanıcı giriş yapamaz: login sayfasında kalır.
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await ctx.close();
    // temizlik: geri aktifleştir (diğer testler bayi login'ini kullanıyor).
    await query(
      `UPDATE "User" SET status = 'ACTIVE' WHERE email = 'bayi@medikal.local'`
    );
    await query(
      `UPDATE "Dealer" SET status = 'ACTIVE' WHERE code = 'BAYI-001'`
    );
  }
});
