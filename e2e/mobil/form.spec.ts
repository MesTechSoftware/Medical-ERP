import { test, expect, type Page } from "@playwright/test";
import { dokunmaHedefi, telefonda } from "./ortak";

/** Sayfadaki görünür metin alanlarının (input/select/textarea) en küçük yazı boyutu. */
async function enKucukYazi(page: Page) {
  return page.evaluate(() => {
    const alanlar = [...document.querySelectorAll<HTMLElement>("main input, main select, main textarea")].filter(
      (e) => !["hidden", "checkbox", "radio"].includes((e as HTMLInputElement).type) && e.offsetParent !== null
    );
    return { adet: alanlar.length, enKucuk: Math.min(...alanlar.map((e) => parseFloat(getComputedStyle(e).fontSize))) };
  });
}

test.describe("yönetici formları", () => {
  test.use({ storageState: "playwright/.auth/admin.json" });

  for (const yol of ["/doctors/new", "/stock", "/orders/new", "/price-lists/new"]) {
    test(`${yol}: dokunmatikte alan yazısı ≥ 16 px, etiket alanın üstünde`, async ({ page }) => {
      await page.goto(yol);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { adet, enKucuk } = await enKucukYazi(page);
      expect(adet).toBeGreaterThan(0);
      expect(enKucuk, "iOS yakınlaştırmasın diye en az 16 px").toBeGreaterThanOrEqual(16);
    });
  }

  test("cari formu: etiket üstte, birincil buton telefonda tam genişlik ve ≥ 44 px", async ({ page }) => {
    await page.goto("/doctors/new");
    const alan = page.getByLabel("Branş");
    const etiket = page.locator('label[for="specialty"]');
    await expect(alan).toBeVisible();
    const [a, e] = [(await alan.boundingBox())!, (await etiket.boundingBox())!];
    expect(e.y + e.height, "etiket alanın üstünde").toBeLessThanOrEqual(a.y + 1);
    const buton = page.getByRole("button", { name: "Cariyi Aç" });
    await dokunmaHedefi(buton, "birincil buton");
    const b = (await buton.boundingBox())!;
    if (telefonda(page)) {
      const form = (await page.locator("main form").first().boundingBox())!;
      expect(b.width, "telefonda tam genişlik").toBeGreaterThanOrEqual(form.width - 2);
    }
  });

  test("tablo satırındaki bağlantı (Detay) dokunmatikte ≥ 44 px", async ({ page }) => {
    await page.goto("/orders");
    const detay = page.getByRole("link", { name: "Detay" }).first();
    await detay.scrollIntoViewIfNeeded();
    await dokunmaHedefi(detay, "Detay");
  });
});

test.describe("satıcı formları", () => {
  test.use({ storageState: "playwright/.auth/seller.json" });

  for (const yol of ["/my-orders/new", "/my-doctors/new", "/my-report"]) {
    test(`${yol}: dokunmatikte alan yazısı ≥ 16 px`, async ({ page }) => {
      await page.goto(yol);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { adet, enKucuk } = await enKucukYazi(page);
      expect(adet).toBeGreaterThan(0);
      expect(enKucuk).toBeGreaterThanOrEqual(16);
    });
  }

  test("sipariş formu: Bedelsiz kutucuğunun etiketi dokunmatikte ≥ 44 px ve işaretler", async ({ page }) => {
    await page.goto("/my-orders/new");
    const etiket = page.locator("label", { hasText: /^Bedelsiz$/ }).first();
    await expect(etiket).toBeVisible();
    const k = (await etiket.boundingBox())!;
    expect(k.height).toBeGreaterThanOrEqual(44);
    await etiket.click();
    await expect(page.getByLabel("Bedelsiz", { exact: true }).first()).toBeChecked();
  });
});
