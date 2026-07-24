import { test, expect } from "@playwright/test";
import { unique } from "../helpers";

test("admin yeni ürün oluşturur ve listede görür", async ({ page }) => {
  const name = unique("Test Ürün");
  const code = unique("TST");

  await page.goto("/products/new");
  await page.getByLabel("Ürün Adı").fill(name);
  await page.getByLabel("Ürün Kodu").fill(code);
  // Fiyatlar NET (KDV hariç) girilir (FR-19).
  await page.getByLabel("Liste Fiyatı — KDV hariç (₺)").fill("123.45");
  await page.getByLabel("Taban Fiyat — KDV hariç (₺)").fill("100");
  await page.getByLabel("Başlangıç Stoğu (adet)").fill("10");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(code)).toBeVisible();
});

test("taban fiyat liste fiyatından yüksek olamaz", async ({ page }) => {
  await page.goto("/products/new");
  await page.getByLabel("Ürün Adı").fill(unique("Hatalı Ürün"));
  await page.getByLabel("Ürün Kodu").fill(unique("ERR"));
  await page.getByLabel("Liste Fiyatı — KDV hariç (₺)").fill("100");
  await page.getByLabel("Taban Fiyat — KDV hariç (₺)").fill("150");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();

  await expect(
    page.getByText("Taban fiyat liste fiyatından yüksek olamaz.")
  ).toBeVisible();
});
