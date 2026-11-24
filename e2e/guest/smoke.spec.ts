import { test, expect } from "@playwright/test";

// Marka sunucuda APP_BRAND'ten gelir; yoksa nötr varsayılan (`src/lib/marka.ts`).
const MARKA = process.env.APP_BRAND?.trim() || "Medikal Satış Operasyon";

test("login sayfası hatasız render olur", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: MARKA })).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel("Şifre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
});
