import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";

/** X-10-2 — fiyat listesi ekranından liste ve barem satırı. */
test("yönetici liste oluşturur, barem satırı ekler ve fiyatı günceller (X-10-2)", async ({ page }) => {
  const kod = `E2E-${Date.now().toString().slice(-8)}`;
  await page.goto("/price-lists");
  await page.getByLabel("Kod").fill(kod.toLowerCase());
  await page.getByLabel("Ad").fill("E2E Liste");
  await page.getByRole("button", { name: "Liste Oluştur" }).click();
  await expect(page.getByText("Liste oluşturuldu.")).toBeVisible();

  await page.getByRole("link", { name: kod }).click();
  await expect(page.getByRole("heading", { name: `${kod} — E2E Liste` })).toBeVisible();
  const urun = page.getByLabel("Ürün");
  await urun.selectOption({ index: 1 });
  await page.getByLabel("Min. adet").fill("10");
  await page.getByLabel(/Liste fiyatı/).fill("80");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Satır kaydedildi.")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);

  await urun.selectOption({ index: 1 });
  await page.getByLabel("Min. adet").fill("10");
  await page.getByLabel(/Liste fiyatı/).fill("75");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator("tbody tr")).toContainText("75,00");
  await expect(page.locator("tbody tr")).toHaveCount(1);

  const satirlar = await sorgu<{ minQuantity: number; listPrice: string }>(
    `SELECT i."minQuantity", i."listPrice"::text FROM "PriceListItem" i JOIN "PriceList" l ON l.id = i."priceListId" WHERE l.code = $1`,
    [kod]
  );
  expect(satirlar).toEqual([{ minQuantity: 10, listPrice: "75.0000" }]);
});
