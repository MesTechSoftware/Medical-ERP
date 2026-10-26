import { test, expect } from "@playwright/test";
import { USERS, login } from "../helpers";
import { dokunmaHedefi, yatayTasmaYok } from "./ortak";

test.use({ storageState: { cookies: [], origins: [] } });

test("giriş ekranı taşmadan açılır; satıcı girişi siparişlerine götürür", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Giriş Yap" })).toBeVisible();
  await yatayTasmaYok(page);
  // Dokunmatikte alan yazısı ≥ 16 px (iOS yakınlaştırmaz), giriş butonu ≥ 44 px.
  for (const ad of ["E-posta", "Şifre"]) {
    const boyut = await page.getByLabel(ad).evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(boyut, ad).toBeGreaterThanOrEqual(16);
  }
  await dokunmaHedefi(page.getByRole("button", { name: "Giriş Yap" }), "Giriş Yap");
  await login(page, USERS.seller);
  await expect(page).toHaveURL(/\/my-orders/);
  await expect(page.getByRole("heading", { level: 1, name: "Siparişlerim" })).toBeVisible();
  await yatayTasmaYok(page);
});
