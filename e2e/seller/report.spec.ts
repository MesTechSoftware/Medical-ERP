import { test, expect } from "@playwright/test";
import { SEED_SELLER_NAME } from "../helpers";

/**
 * X-1-1 · D-2 §(1): satıcı kendi prim/hakedişini ekranda görür; kısıt sorgudadır —
 * tabloda yalnız kendi satırı vardır. Yönetim raporu satıcıya kapalıdır.
 */

test("Raporum yalnız kendi satırını gösterir", async ({ page }) => {
  await page.goto("/my-report");
  await expect(page.getByRole("heading", { name: "Raporum" })).toBeVisible();
  const satirlar = page.locator("tbody tr");
  await expect(satirlar).toHaveCount(1);
  await expect(satirlar.first()).toContainText(SEED_SELLER_NAME);
  await expect(page.getByText("Ayşe Demir")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Hakediş (KDV hariç)", exact: true })).toBeVisible();
});

test("yönetim raporu satıcıya kapalıdır", async ({ page }) => {
  await page.goto("/reports");
  await expect(page).toHaveURL(/\/my-orders/);
});
