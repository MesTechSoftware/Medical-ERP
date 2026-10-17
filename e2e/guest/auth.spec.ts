import { test, expect } from "@playwright/test";
import { USERS } from "../helpers";

test.describe("Girişsiz erişim ve login", () => {
  test("yanlış şifre hata mesajı gösterir", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-posta").fill(USERS.admin.email);
    await page.getByLabel("Şifre").fill("yanlis-sifre");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(
      page.getByText("E-posta veya şifre hatalı.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("girişsiz korumalı sayfa /login'e yönlendirir", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("kök yol girişsiz /login'e yönlendirir", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
