import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** Ü-42 M4 — Sevkiyat takip/irsaliye düzeltme (D-3-3). */

test("Sevkiyatlar'dan takip no ve irsaliye no düzeltilir; durum değişmez (D-3-3)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await sorgu(`UPDATE "Order" SET status = 'KARGOLANDI' WHERE id = $1`, [s.siparisId]);
  const id = `e2e-duzelt-${s.siparisId}`;
  await sorgu(
    `INSERT INTO "Shipment" (id, "documentNo", "orderId", status, "shippedAt", "trackingNumber", "updatedAt") VALUES ($1, $2, $3, 'KARGOLANDI', now(), 'ESKI-1', now())`,
    [id, `E2E-DZ-${s.siparisId}`, s.siparisId]
  );
  await page.goto(`/shipping?q=${s.documentNo}`);
  await page.locator(`[data-duzenle="${id}"]`).click();
  await page.getByLabel("Takip Numarası").fill("YENI-2");
  await page.getByLabel("İrsaliye No (isteğe bağlı)").fill("IRS-77");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect.poll(async () => (await sorgu<{ t: string }>(`SELECT "trackingNumber" t FROM "Shipment" WHERE id = $1`, [id]))[0].t).toBe("YENI-2");
  const [v] = await sorgu<{ i: string; st: string }>(`SELECT "externalDispatchNo" i, status st FROM "Shipment" WHERE id = $1`, [id]);
  expect([v.i, v.st]).toEqual(["IRS-77", "KARGOLANDI"]);
});
