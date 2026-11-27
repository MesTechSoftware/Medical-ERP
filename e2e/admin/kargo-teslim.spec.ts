import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** Ü-42 M3 — Kargo Sevkiyatlar'da Teslim: sipariş başına bir kez, en yeni satırda (A-3-9). */

test("Teslim yalnız en yeni sevkiyat satırında; onaylayınca bütün sevkiyatlar teslim edilir (A-3-9)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await sorgu(`UPDATE "Order" SET status = 'KARGOLANDI' WHERE id = $1`, [s.siparisId]);
  for (const [i, gun] of [[1, "2026-10-01"], [2, "2026-10-02"]] as const) {
    await sorgu(
      `INSERT INTO "Shipment" (id, "documentNo", "orderId", status, "shippedAt", "updatedAt") VALUES ($1, $2, $3, 'KARGOLANDI', $4, now())`,
      [`e2e-svk-${s.siparisId}-${i}`, `E2E-SVK-${s.siparisId}-${i}`, s.siparisId, gun]
    );
  }
  await page.goto(`/shipping?q=${s.documentNo}`);
  const tablo = page.getByRole("table", { name: "Sevkiyatlar" });
  await expect(tablo.getByRole("button", { name: "Teslim" })).toHaveCount(1);
  page.once("dialog", (d) => d.accept());
  await tablo.getByRole("button", { name: "Teslim" }).click();
  await expect(tablo.getByRole("button", { name: "Teslim" })).toHaveCount(0);
  const [{ n }] = await sorgu<{ n: string }>(`SELECT count(*) n FROM "Shipment" WHERE "orderId" = $1 AND status = 'TESLIM_EDILDI'`, [s.siparisId]);
  expect(Number(n)).toBe(2);
});
