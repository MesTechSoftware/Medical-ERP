import { test, expect } from "@playwright/test";

/**
 * ADR-009 — masaüstü (fare) compact ritim: tablo satırı, başlık ve araç çubuğu 32 px;
 * dokunmatik genişletmeler masaüstünde devreye girmez; en geniş tablolarda sayfa yatay kaymaz.
 */

const yakin = (deger: number, hedef: number) => expect(Math.abs(deger - hedef)).toBeLessThanOrEqual(1.5);

test("masaüstünde tablo satırı, başlık, hap ve sayfalama 32 px", async ({ page }) => {
  await page.goto("/orders?per=1");
  const tablo = page.getByRole("table");
  yakin((await tablo.getByRole("columnheader").first().boundingBox())!.height, 32);
  yakin((await tablo.getByRole("row").nth(1).getByRole("cell").first().boundingBox())!.height, 32);
  yakin((await page.getByRole("link", { name: "Tümü", exact: true }).boundingBox())!.height, 32);
  yakin((await page.getByRole("navigation", { name: "Sayfalama" }).getByRole("link", { name: "Sonraki" }).boundingBox())!.height, 32);
});

test("masaüstünde kutucuk alanı büyümez", async ({ page }) => {
  await page.goto("/doctors");
  const kutucuk = page.getByRole("checkbox", { name: /seç$/ }).first();
  const alan = kutucuk.locator("xpath=ancestor::label[1]");
  expect((await alan.boundingBox())!.height).toBeLessThan(32);
});

for (const yol of ["/orders", "/doctors", "/stock", "/audit-logs", "/collections", "/imports"]) {
  test(`masaüstünde ${yol} yatay kaymaz`, async ({ page }) => {
    await page.goto(yol);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
