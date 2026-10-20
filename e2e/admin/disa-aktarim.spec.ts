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
  await page.getByLabel("Veri Seti").selectOption("DOKTOR_LISTESI");
  await page.getByLabel("Biçim").selectOption("csv");
  const indirme = page.waitForEvent("download");
  await page.getByRole("button", { name: "Dosyayı İndir" }).click();
  const dosya = await indirme;

  expect(dosya.suggestedFilename()).toBe("doktor_listesi.csv");
  const icerik = readFileSync((await dosya.path())!, "utf8");
  expect(icerik.split("\r\n")[0]).toContain("VKN / TCKN");
  await expect(page.getByText(/Dosya hazırlandı: \d+ satır\./)).toBeVisible();
  expect(await kutukSayisi("DOKTOR_LISTESI")).toBe(once + 1);
});

test("aralık okuyan veri seti dönemsiz çalışmaz; alanın altında gösterilir (D-5-1)", async ({ page }) => {
  await page.goto("/exports");
  await page.getByLabel("Veri Seti").selectOption("TAHSILAT");
  await page.getByLabel("Başlangıç günü").fill("2026-10-31");
  await page.getByLabel("Bitiş günü (dahil)").fill("2026-10-01");
  await page.getByRole("button", { name: "Dosyayı İndir" }).click();
  await expect(page.locator("#bitis-hata")).toHaveText("Bitiş günü başlangıç gününden önce olamaz.");
});
