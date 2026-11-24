import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/**
 * A-4-1 · B-4-5 — stok ekranından konsinye çıkış ve depoya transfer; mali sonucu yok.
 */
test("konsinye çıkış doktorun konumuna taşır, transfer depoya geri alır (A-4-1, B-4-5)", async ({ page }) => {
  const s = await stoksuzSiparis({ stoklu: true }); // yeni doktor + 10 adet stoklu yeni ürün
  await page.goto("/stock");
  await page.getByRole("link", { name: "Konsinye Çıkış" }).click();

  const konsinye = page.locator("form").filter({ has: page.getByRole("button", { name: "Konsinye Çıkış Kaydet" }) });
  await konsinye.getByLabel("Doktor").selectOption({ label: s.doktorAdi });
  await konsinye.getByLabel("Ürün").selectOption({ label: `${s.urunAdi} (${s.urunKodu})` });
  await konsinye.getByLabel("Miktar (adet)").fill("3");
  await konsinye.getByRole("button", { name: "Konsinye Çıkış Kaydet" }).click();
  await expect(page.getByText(/Konsinye çıkış kaydedildi: KNS-/)).toBeVisible();
  await expect(page.getByText(`Konsinye — ${s.doktorAdi} · ${s.urunAdi}`)).toBeVisible();

  await page.goto("/stock?islem=transfer");
  const transfer = page.locator("form").filter({ has: page.getByRole("button", { name: "Transfer Kaydet" }) });
  await transfer.getByLabel("Kaynak").selectOption({ label: `Konsinye — ${s.doktorAdi}` });
  await transfer.getByLabel("Ürün").selectOption({ label: `${s.urunAdi} (${s.urunKodu})` });
  await transfer.getByLabel("Miktar (adet)").fill("1");
  await transfer.getByRole("button", { name: "Transfer Kaydet" }).click();
  await expect(page.getByText(/Transfer kaydedildi: TRF-/)).toBeVisible();

  const stok = await sorgu<{ type: string; miktar: string }>(
    `SELECT l.type::text, SUM(CASE WHEN m.type = 'GIRIS' THEN m.quantity ELSE -m.quantity END)::text AS miktar
     FROM "StockMovement" m JOIN "StockLocation" l ON l.id = m."locationId"
     WHERE m."productId" = $1 GROUP BY l.type ORDER BY l.type`,
    [s.urunId]
  );
  expect(stok).toEqual([
    { type: "DEPO", miktar: "8" },
    { type: "KONSINYE", miktar: "2" },
  ]);
  expect(await sorgu(`SELECT 1 FROM "LedgerEntry" l JOIN "Doctor" d ON d.id = l."doctorId" WHERE d."fullName" = $1`, [s.doktorAdi])).toHaveLength(0);
});
