import { test, expect } from "@playwright/test";
import { sevkKartiAc } from "../helpers";
import { Client } from "pg";

/**
 * A-3-1 — kısmi sevkiyat ekrandan: kalem miktarı girilir, borç ve stok çıkışı sevkiyatta doğar,
 * sipariş kalan miktar sevk edilene kadar "Kargo Bekleyenler"de kalır.
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function sorgu<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

test("kısmi sevkiyat: 3'ün 1'i sevk edilir, borç yazılır, sipariş beklemede kalır (A-3-1)", async ({ page }) => {
  const ek = Date.now().toString().slice(-7);
  const doktorAdi = `Dr. Sevk ${ek}`;
  const [{ id: doktorId }] = await sorgu<{ id: string }>(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", clinic, region, "phoneNormalized", "partyType", status)
     VALUES ($1, 'DOKTOR', $2, 'Klinik', 'Bölge', $3, 'TUZEL_KISI', 'AKTIF') RETURNING id`,
    [`e2e-dr-${ek}`, doktorAdi, `+90539${ek}`]
  );
  // Stoğu yeten ürün: stoksuz ürünün sevkiyatı onaya düşer (A-8, `onay.spec.ts`).
  const [urun] = await sorgu<{ id: string }>(
    `SELECT "productId" AS id FROM "StockMovement" GROUP BY "productId"
     HAVING SUM(CASE WHEN type = 'GIRIS' THEN quantity ELSE -quantity END) >= 3 ORDER BY "productId" LIMIT 1`
  );
  const [satici] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SATICI' ORDER BY email LIMIT 1`);
  const siparisId = `e2e-sip-${ek}`;
  const kalemId = `e2e-kal-${ek}`;
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", "sellerId", stage, status, "paymentTermDays", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ONAYLI', 'HAZIRLANIYOR', 30, now())`,
    [siparisId, `E2E-SIP-${ek}`, doktorId, satici.id]
  );
  await sorgu(
    `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "listPrice", "unitPrice", "vatRate")
     VALUES ($1, $2, $3, 3, 100, 100, 20)`,
    [kalemId, siparisId, urun.id]
  );

  const kart = await sevkKartiAc(page, doktorAdi);
  await expect(kart.getByText("kalan 3/3")).toBeVisible();
  await kart.locator(`#miktar_${kalemId}`).fill("1");
  await kart.getByRole("button", { name: "Kargola" }).click();

  // Kısmi sevkten sonra panel güncel kalanla açık kalır (Ü-24 §3.4).
  await expect(page).toHaveURL(/\/shipping\?kismi=[^&]+$/);
  await expect(page.locator("[data-sevk-karti]").filter({ hasText: doktorAdi }).getByText("kalan 2/3")).toBeVisible();
  // Panel güncel kalanla yeniden kurulur: girilen miktar ve takip no kalmaz.
  await expect(page.locator("[data-sevk-karti]").locator('input[name^="miktar_"]')).toHaveValue("2");
  await expect(page.locator("[data-sevk-karti]").getByLabel("Takip Numarası")).toHaveValue("");
  const [borc] = await sorgu<{ amount: string; type: string }>(
    `SELECT amount::text, type FROM "LedgerEntry" WHERE "doctorId" = $1`,
    [doktorId]
  );
  expect(borc).toEqual({ amount: "120.00", type: "SEVKIYAT" });
  const [{ status }] = await sorgu<{ status: string }>(`SELECT status FROM "Order" WHERE id = $1`, [siparisId]);
  expect(status).toBe("HAZIRLANIYOR");
});

test("kalanı kapat: gerekçe zorunlu, sipariş kargolandı olur, rozet ve sevk/kalan görünür (A-3-4/6/7)", async ({ page }) => {
  const ek = Date.now().toString().slice(-7);
  const doktorAdi = `Dr. Kapat ${ek}`;
  const [{ id: doktorId }] = await sorgu<{ id: string }>(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", clinic, region, "phoneNormalized", "partyType", status)
     VALUES ($1, 'DOKTOR', $2, 'Klinik', 'Bölge', $3, 'TUZEL_KISI', 'AKTIF') RETURNING id`,
    [`e2e-drk-${ek}`, doktorAdi, `+90538${ek}`]
  );
  const [urun] = await sorgu<{ id: string }>(
    `SELECT "productId" AS id FROM "StockMovement" GROUP BY "productId"
     HAVING SUM(CASE WHEN type = 'GIRIS' THEN quantity ELSE -quantity END) >= 3 ORDER BY "productId" LIMIT 1`
  );
  const [satici] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SATICI' ORDER BY email LIMIT 1`);
  const siparisId = `e2e-sipk-${ek}`;
  const kalemId = `e2e-kalk-${ek}`;
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", "sellerId", stage, status, "paymentTermDays", "updatedAt")
     VALUES ($1, $2, $3, $4, 'ONAYLI', 'HAZIRLANIYOR', 30, now())`,
    [siparisId, `E2E-SIPK-${ek}`, doktorId, satici.id]
  );
  await sorgu(
    `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "listPrice", "unitPrice", "vatRate")
     VALUES ($1, $2, $3, 3, 100, 100, 20)`,
    [kalemId, siparisId, urun.id]
  );

  // Sevkiyatsız siparişte kapatma sunulmaz; bir sevkiyattan sonra sunulur.
  await page.goto(`/orders/${siparisId}`);
  await expect(page.getByRole("heading", { name: "Kalanı Kapat" })).toHaveCount(0);
  const kart = await sevkKartiAc(page, doktorAdi);
  await kart.locator(`#miktar_${kalemId}`).fill("1");
  await kart.getByRole("button", { name: "Kargola" }).click();
  await expect(page.locator("[data-sevk-karti]").filter({ hasText: doktorAdi }).getByText("kalan 2/3")).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await page.goto(`/orders/${siparisId}`);
  await expect(page.getByRole("heading", { name: "Kalanı Kapat" })).toBeVisible();
  await expect(page.locator("[data-sevkiyat]")).toHaveCount(1);

  // DIGER'de açıklama zorunlu.
  await page.getByLabel("Kapatma gerekçesi").selectOption("DIGER");
  await page.getByRole("button", { name: /Kalanı Kapat \(2 adet\)/ }).click();
  await expect(page.getByText("Bu alan zorunludur.")).toBeVisible();

  await page.getByLabel(/Açıklama/).fill("Üretimden kalktı");
  await page.getByRole("button", { name: /Kalanı Kapat \(2 adet\)/ }).click();
  await expect(page.locator("[data-kismi-kapatildi]")).toContainText("Diğer — Üretimden kalktı");
  await expect(page.locator("[data-kalem-miktari]")).toContainText("Sevk 1 · Kalan 0 · Kapatılan 2");
  await expect(page.getByRole("heading", { name: "Kalanı Kapat" })).toHaveCount(0);
  const [{ status }] = await sorgu<{ status: string }>(`SELECT status FROM "Order" WHERE id = $1`, [siparisId]);
  expect(status).toBe("KARGOLANDI");
});
