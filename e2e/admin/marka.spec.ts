import { test, expect } from "@playwright/test";

// E-2: sekme başlığı "Sayfa · {marka}"; marka APP_BRAND'den, yoksa nötr varsayılan; kenar çubuğunda marka adı.
const MARKA = process.env.APP_BRAND?.trim() || "Medikal Satış Operasyon";

test("sekme başlığı sayfa adı ve marka içerir; kenar çubuğunda marka görünür (E-2)", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveTitle(`Siparişler · ${MARKA}`);
  await expect(page.getByRole("complementary").getByText(MARKA, { exact: true }).first()).toBeVisible();
  await page.goto("/stock");
  await expect(page).toHaveTitle(`Stok · ${MARKA}`);
});
