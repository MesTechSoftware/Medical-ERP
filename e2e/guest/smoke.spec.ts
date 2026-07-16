import { test, expect } from "@playwright/test";

test("login sayfası hatasız render olur", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Medikal Satış Operasyon" })
  ).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel("Şifre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
});
