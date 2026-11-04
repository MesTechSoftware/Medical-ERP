import { readFileSync } from "node:fs";

import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * D-5-1 · D-5-2 — yönetici veri setini dosya olarak indirir; dosya sunucuda saklanmaz,
 * her indirme kütüğe yazılır.
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function kutukSayisi(kod: string): Promise<number> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const r = await client.query(`SELECT count(*)::int AS n FROM "ExportLog" WHERE "datasetCode" = $1`, [kod]);
    return r.rows[0].n as number;
  } finally {
    await client.end();
  }
}

test("doktor listesi CSV olarak iner ve kütüğe yazılır (D-5-1, D-5-2)", async ({ page }) => {
  const once = await kutukSayisi("DOKTOR_LISTESI");
  await page.goto("/exports");
  await page.getByRole("radiogroup", { name: "Veri seti" }).getByLabel(/Doktor listesi/).check();
  await page.getByRole("radiogroup", { name: "Biçim" }).getByLabel("CSV (.csv)").check();
  const indirme = page.waitForEvent("download");
  await page.getByRole("button", { name: "Dosyayı İndir" }).click();
  const dosya = await indirme;

  expect(dosya.suggestedFilename()).toBe("doktor_listesi.csv");
  const icerik = readFileSync((await dosya.path())!, "utf8");
  expect(icerik.split("\r\n")[0]).toContain("VKN / TCKN");
  await expect(page.getByText(/Dosya hazırlandı: \d+ satır\./)).toBeVisible();
  expect(await kutukSayisi("DOKTOR_LISTESI")).toBe(once + 1);
  // Seçilen biçim indirmeden sonra Excel'e dönmez.
  await expect(page.getByRole("radiogroup", { name: "Biçim" }).getByLabel("CSV (.csv)")).toBeChecked();
});

test("aralık okuyan veri seti dönemsiz çalışmaz; alanın altında gösterilir (D-5-1)", async ({ page }) => {
  await page.goto("/exports");
  await page.getByRole("radiogroup", { name: "Veri seti" }).getByLabel(/Tahsilat hareket listesi/).check();
  await page.getByLabel("Başlangıç günü").fill("2026-10-31");
  await page.getByLabel("Bitiş günü (dahil)").fill("2026-10-01");
  await page.getByRole("button", { name: "Dosyayı İndir" }).click();
  await expect(page.locator("#bitis-hata")).toHaveText("Bitiş günü başlangıç gününden önce olamaz.");
  // Hatadan sonra girilen günler silinmez (form sıfırlanmaz).
  await expect(page.getByLabel("Başlangıç günü")).toHaveValue("2026-10-31");
});

test("dönem kısayolu alanları doldurur; şablonsuz fatura hazırlık seçilemez; geçmiş yok (D-5-3)", async ({ page }) => {
  await page.goto("/exports");
  const setler = page.getByRole("radiogroup", { name: "Veri seti" });
  await expect(setler.getByRole("radio")).toHaveCount(6);
  await expect(setler.getByLabel(/Fatura hazırlık/)).toBeDisabled();
  await setler.getByLabel(/Tahsilat hareket listesi/).check();
  await page.getByRole("group", { name: "Dönem kısayolları" }).getByRole("button", { name: "Geçen ay" }).click();
  const baslangic = await page.getByLabel("Başlangıç günü").inputValue();
  const bitis = await page.getByLabel("Bitiş günü (dahil)").inputValue();
  expect(baslangic).toMatch(/^\d{4}-\d{2}-01$/);
  expect(bitis.slice(0, 7)).toBe(baslangic.slice(0, 7));
  const indirme = page.waitForEvent("download");
  await page.getByRole("button", { name: "Dosyayı İndir" }).click();
  await indirme;
  await expect(page.getByText(/Dosya hazırlandı: \d+ satır\./)).toBeVisible();
  // İndirmeden sonra kısayolun doldurduğu günler yerinde kalır.
  await expect(page.getByLabel("Başlangıç günü")).toHaveValue(baslangic);
  await expect(page.locator("main").getByText(/geçmiş|son indirmeler/i)).toHaveCount(0);
});
