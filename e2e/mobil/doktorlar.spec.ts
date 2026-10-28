import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";
import { telefonda, yatayTasmaYok } from "./ortak";

test.use({ storageState: "playwright/.auth/admin.json" });

/** Ü-18 — cari yan paneli telefonda tam ekran, geniş ekranda sağdan; panel açıkken sayfa yatay kaymaz. */
test("cari yan paneli telefonda tam ekran, tablette sağda", async ({ page }) => {
  const [d] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" ORDER BY "fullName" LIMIT 1`);
  await page.goto(`/doctors?detay=${d.id}`);
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
  await yatayTasmaYok(page, "/doctors (panel açık)");
});
