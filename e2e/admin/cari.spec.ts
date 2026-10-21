import { test, expect } from "@playwright/test";

/** X-8-2 · A-13-1 · X-10-3 — yönetici bayi açar, fatura bilgisi doğrulanır, liste atanır. */
test("yönetici bayi açar; geçersiz VKN alan altında reddedilir; düzenlemede fiyat listesi atanır", async ({ page }) => {
  const ek = `${Date.now()}`.slice(-7);
  const ad = `E2E Bayi ${ek}`;
  await page.goto("/doctors/new");
  await page.getByLabel("Bayi").check();
  await page.getByLabel("Ünvan / Ad").fill(ad);
  await page.getByLabel("Telefon", { exact: true }).fill(`0216${ek}`);
  await page.getByText("Fatura bilgileri").click();
  await page.getByLabel("VKN / TCKN").fill("1234567891");
  await page.getByRole("button", { name: "Cariyi Aç" }).click();
  await expect(page.getByText("VKN 10, TCKN 11 haneli olmalı ve kontrol hanesi tutmalıdır.")).toBeVisible();
  await expect(page.getByLabel("Ünvan / Ad")).toHaveValue(ad);

  await page.getByLabel("VKN / TCKN").fill("1234567890");
  await page.getByRole("button", { name: "Cariyi Aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: ad })).toBeVisible();
  await expect(page.getByText("Bayi", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("1234567890")).toBeVisible();

  await page.getByRole("link", { name: "Düzenle" }).click();
  await page.getByLabel("Fiyat listesi (boş: varsayılan)").selectOption({ index: 1 });
  const liste = await page.getByLabel("Fiyat listesi (boş: varsayılan)").locator("option:checked").textContent();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: ad })).toBeVisible();
  await expect(page.getByText(liste!.trim())).toBeVisible();
});
