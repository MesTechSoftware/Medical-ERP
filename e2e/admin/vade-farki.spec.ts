import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** A-7-2 · X-11-2 — cari detayında elle vade farkı ve ters kaydı. */
test("yönetici vade farkı ekler, hareketlerde görünür; ters kayıtla çevrilir (A-7-2, X-11-2)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await page.goto(`/doctors/${s.doktorId}`);
  await page.getByText("Vade farkı ekle").click();
  await page.getByLabel(/Tutar/).fill("150");
  await page.getByLabel("Vade", { exact: true }).fill("2026-12-31");
  await page.getByLabel("Gerekçe", { exact: true }).fill("Gecikme");
  await page.getByRole("button", { name: "Kaydet" }).last().click();
  await expect(page.getByText("Vade farkı kaydedildi.")).toBeVisible();

  const satir = page.locator("tr", { hasText: "Vade farkı" }).filter({ hasText: "VDF-" });
  await expect(satir).toBeVisible();
  await satir.getByText("Ters kayıt").click();
  await satir.getByLabel("Ters kayıt gerekçesi").fill("Yanlış tutar");
  await satir.getByRole("button", { name: "Çevir" }).click();
  await expect(page.getByText("(çevrildi)")).toBeVisible();

  const hareketler = await sorgu<{ type: string; direction: string }>(
    `SELECT type::text, direction::text FROM "LedgerEntry" WHERE "doctorId" = $1 ORDER BY "createdAt"`,
    [s.doktorId]
  );
  expect(hareketler).toEqual([
    { type: "VADE_FARKI", direction: "BORC" },
    { type: "TERS_KAYIT", direction: "ALACAK" },
  ]);
});
