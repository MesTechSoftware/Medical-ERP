import { test, expect } from "@playwright/test";
import { telefonda, yatayTasmaYok } from "./ortak";

test.use({ storageState: "playwright/.auth/admin.json" });

/** X-18-7 — detay paneli telefonda tam ekran, geniş ekranda sağdan; panel açıkken sayfa yatay kaymaz. */
test("detay paneli telefonda tam ekran, tablette sağda; sayfa yatay kaymaz", async ({ page }) => {
  await page.goto("/audit-logs");
  await page.getByRole("link", { name: "Detay" }).first().click();
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
  await yatayTasmaYok(page, "/audit-logs (panel açık)");
});
