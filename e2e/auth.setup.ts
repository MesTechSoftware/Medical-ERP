import { test as setup, expect } from "@playwright/test";
import { USERS, login } from "./helpers";

const adminFile = "playwright/.auth/admin.json";
const sellerFile = "playwright/.auth/seller.json";
const operasyonFile = "playwright/.auth/operasyon.json";

setup("admin oturumu", async ({ page }) => {
  await login(page, USERS.admin);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: adminFile });
});

setup("satıcı oturumu", async ({ page }) => {
  await login(page, USERS.seller);
  await expect(page).toHaveURL(/\/my-orders/);
  await page.context().storageState({ path: sellerFile });
});

// D-2 17.10 eki: OPERASYON giriş yapar, ana sayfası Dashboard'dur.
setup("operasyon oturumu", async ({ page }) => {
  await login(page, USERS.operasyon);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: operasyonFile });
});
