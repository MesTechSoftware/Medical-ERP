import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** Ü-42 M3 — sipariş panelinden durum işlemi (A-3-8) ve toplu Hazırlığa Al (A-3-10). */

test("panelde Hazırlığa Al: aynı ekranda kalır, panel açık, iptal düğmesi yok (A-3-8)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await sorgu(`UPDATE "Order" SET status = 'BEKLIYOR' WHERE id = $1`, [s.siparisId]);
  await page.goto(`/orders?detay=${s.siparisId}`);
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("button", { name: /İptal/ })).toHaveCount(0);
  await panel.getByRole("button", { name: "Hazırlığa Al" }).click();
  await expect(page).toHaveURL(new RegExp(`/orders\\?detay=${s.siparisId}`));
  await expect(page.getByRole("dialog").getByRole("link", { name: "Kargo Bilgisi Gir" })).toBeVisible();
});

test("toplu Hazırlığa Al: seçilen iki sipariş ilerler, sonuç sipariş başına (A-3-10)", async ({ page }) => {
  const a = await stoksuzSiparis();
  const b = await stoksuzSiparis();
  await sorgu(`UPDATE "Order" SET status = 'BEKLIYOR' WHERE id = ANY($1)`, [[a.siparisId, b.siparisId]]);
  await page.goto("/orders?durum=BEKLIYOR&per=100");
  await page.getByLabel(`${a.documentNo} seç`).check();
  await page.getByLabel(`${b.documentNo} seç`).check();
  await page.getByRole("button", { name: "Seçilenleri hazırlığa al" }).click();
  const sonuc = page.getByRole("status", { name: "Toplu hazırlık sonucu" });
  await expect(sonuc).toContainText(a.documentNo);
  await expect(sonuc).toContainText(b.documentNo);
  await expect(sonuc.getByText("Hazırlığa alındı")).toHaveCount(2);
});
