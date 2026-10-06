import { test, expect } from "@playwright/test";
import { unique } from "../helpers";

test("admin yeni ürün oluşturur ve listede görür", async ({ page }) => {
  const name = unique("Test Ürün");
  const code = unique("TST");

  await page.goto("/products/new");
  await page.getByLabel("Ürün Adı").fill(name);
  await page.getByLabel("Ürün Kodu").fill(code);
  // Fiyat NET (KDV hariç) girilir (FR-19) ve varsayılan listenin satırına yazılır (X-10 §(5)).
  // Taban fiyat alanı C6/CM'de kalktı (GÇ-8).
  await page.getByLabel("Liste Fiyatı — KDV hariç (₺)").fill("123,45");
  await page.getByLabel("Başlangıç Stoğu (adet)").fill("10");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(code)).toBeVisible();
  // Liste fiyatı varsayılan listeden okunur; stok başlangıç hareketinden türer (ADR-005).
  const row = page.getByRole("row", { name: new RegExp(code) });
  await expect(row).toContainText("123,45");
  await expect(row).toContainText("10");
});
