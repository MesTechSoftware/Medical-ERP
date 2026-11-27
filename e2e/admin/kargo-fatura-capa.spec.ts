import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** Ü-42 M2 — Kargo → fatura köprüsü: Sevkiyatlar bağlantısı sipariş detayındaki fatura kartı çapasına gider (K-4-5, K-4-6). */

test("Sevkiyat satırından fatura kartı çapasına gidilir; kartta Tümünü Kopyala var, Yazdır yok", async ({ page }) => {
  const s = await stoksuzSiparis();
  await sorgu(`UPDATE "Order" SET status = 'KARGOLANDI' WHERE id = $1`, [s.siparisId]);
  await sorgu(
    `INSERT INTO "Shipment" (id, "documentNo", "orderId", status, "shippedAt", "updatedAt") VALUES ($1, $2, $3, 'KARGOLANDI', now(), now())`,
    [`e2e-capa-${s.siparisId}`, `E2E-CAPA-${s.siparisId}`, s.siparisId]
  );
  await page.goto(`/shipping?q=${s.documentNo}`);
  await page.getByRole("table", { name: "Sevkiyatlar" }).getByRole("link", { name: /Fatura bilgisi/ }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${s.siparisId}#fatura-`));
  await expect(page.getByRole("button", { name: "Tümünü Kopyala" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Yazdır/ })).toHaveCount(0);
});
