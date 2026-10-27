import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** B-7-1 — stok düzeltme ekrandan: çok satır, ± fark, sebep, açıklama, tutanak no. */
test("yönetici iki satırlı düzeltme kaydeder; stok ve belge yazılır (B-7-1)", async ({ page }) => {
  const s = await stoksuzSiparis({ stoklu: true }); // 10 adet stoklu yeni ürün
  await page.goto("/stock");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Düzeltmeyi Kaydet" }) });
  const urun = `${s.urunAdi} (${s.urunKodu})`;

  await form.getByLabel("Ürün").selectOption({ label: urun });
  await form.getByLabel("Fark (±)").fill("-2");
  await form.getByLabel("Sebep").selectOption({ label: "Hasar" });
  await form.getByLabel("Açıklama").fill("Kırık kutu");
  await form.getByRole("button", { name: "Satır Ekle" }).click();
  await form.locator("#dzl-urun-1").selectOption({ label: urun });
  await form.locator("#dzl-fark-1").fill("1");
  await form.locator("#dzl-sebep-1").selectOption({ label: "Sayım farkı" });
  await form.locator("#dzl-aciklama-1").fill("Rafta bulundu");
  await form.getByLabel("Tutanak No (isteğe bağlı)").fill("TUT-E2E");
  await form.getByRole("button", { name: "Düzeltmeyi Kaydet" }).click();
  await expect(page.getByText(/Stok düzeltme kaydedildi: DZL-/)).toBeVisible();

  const [{ miktar }] = await sorgu<{ miktar: string }>(
    `SELECT SUM(CASE WHEN type = 'GIRIS' THEN quantity ELSE -quantity END)::text AS miktar FROM "StockMovement" WHERE "productId" = $1`,
    [s.urunId]
  );
  expect(miktar).toBe("9");
  const [belge] = await sorgu<{ externalDocNo: string; satir: string }>(
    `SELECT a."externalDocNo", COUNT(i.id)::text AS satir FROM "StockAdjustment" a JOIN "StockAdjustmentItem" i ON i."stockAdjustmentId" = a.id
     WHERE i."productId" = $1 GROUP BY a.id`,
    [s.urunId]
  );
  expect(belge).toEqual({ externalDocNo: "TUT-E2E", satir: "2" });
});
