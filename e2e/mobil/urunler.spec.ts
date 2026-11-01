import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";
import { telefonda, yatayTasmaYok } from "./ortak";

test.use({ storageState: "playwright/.auth/admin.json" });

/** Ü-19 — ürün yan paneli telefonda tam ekran, geniş ekranda sağdan; panel açıkken sayfa yatay kaymaz. */
test("ürün paneli telefonda tam ekran, tablette sağda", async ({ page }) => {
  const [u] = await sorgu<{ id: string }>(`SELECT id FROM "Product" ORDER BY name LIMIT 1`);
  await page.goto(`/products?detay=${u.id}`);
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();
  const kutu = (await panel.boundingBox())!;
  const genislik = page.viewportSize()!.width;
  if (telefonda(page)) {
    expect(Math.round(kutu.width)).toBe(genislik);
  } else {
    expect(Math.round(kutu.x + kutu.width)).toBe(genislik);
    expect(kutu.width).toBeLessThan(genislik);
  }
  await yatayTasmaYok(page, "/products (panel açık)");
});
