import { test, expect } from "@playwright/test";
import { USERS, login } from "../helpers";
import { yatayTasmaYok } from "./ortak";

test.use({ storageState: { cookies: [], origins: [] } });

test("giriş ekranı taşmadan açılır; satıcı girişi siparişlerine götürür", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
  await yatayTasmaYok(page);
  await login(page, USERS.seller);
  await expect(page).toHaveURL(/\/my-orders/);
  await expect(page.getByRole("heading", { level: 1, name: "Siparişlerim" })).toBeVisible();
  await yatayTasmaYok(page);
});
