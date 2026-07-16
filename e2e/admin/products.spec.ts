import { test, expect } from "@playwright/test";
import { unique } from "../helpers";

test("admin yeni ürün oluşturur ve listede görür", async ({ page }) => {
  const name = unique("Test Ürün");
  const code = unique("TST");

  await page.goto("/products/new");
  await page.getByLabel("Ürün Adı").fill(name);
  await page.getByLabel("Ürün Kodu").fill(code);
  await page.getByLabel("Satış Fiyatı (₺)").fill("123.45");
  await page.getByLabel("Başlangıç Stoğu (adet)").fill("10");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText(code)).toBeVisible();
});
