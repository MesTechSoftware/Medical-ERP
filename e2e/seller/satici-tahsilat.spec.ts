import { test, expect } from "@playwright/test";

/** Ü-42 (M5): Raporum dönem tahsilatları tablosu ve sipariş durum çizelgesi — satıcı ekranları. */

test("Raporum Dönem Tahsilatları tablosu: Tutar sütunu, indirme yok (D-2-5)", async ({ page }) => {
  await page.goto("/my-report");
  const tablo = page.getByRole("table", { name: "Dönem tahsilatları" });
  await expect(tablo).toBeVisible();
  await expect(tablo.getByRole("columnheader", { name: "Tutar", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /indir|csv|excel/i })).toHaveCount(0);
});

test("Sipariş detayında durum çizelgesi görünür; satıcıda 'Fatura Hazırlık' geçmez (A-3-10)", async ({ page }) => {
  await page.goto("/my-orders");
  const ilkSatir = page.locator("table tbody tr").first();
  await expect(ilkSatir).toBeVisible();
  await ilkSatir.getByRole("link", { name: "Detay" }).click();
  await expect(page.locator("[data-durum-cizelgesi]")).toBeVisible();
  await expect(page.getByText("Fatura Hazırlık")).toHaveCount(0);
});
