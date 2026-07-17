import { test, expect } from "@playwright/test";
import { unique } from "../helpers";

test("admin yeni satıcı oluşturur ve listede görür", async ({ page }) => {
  const name = unique("Test Satıcı");
  const email = `${unique("satici")}@test.local`;

  await page.goto("/sellers/new");
  await page.getByLabel("Ad Soyad").fill(name);
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Telefon").fill("0500 000 00 00");
  await page.getByLabel("Şifre", { exact: true }).fill("test123");
  await page.getByRole("button", { name: "Satıcı Ekle" }).click();

  await expect(page).toHaveURL(/\/sellers$/);
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});
