import { test as setup, expect } from "@playwright/test";
import { USERS, login } from "./helpers";

const adminFile = "playwright/.auth/admin.json";
const sellerFile = "playwright/.auth/seller.json";

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
