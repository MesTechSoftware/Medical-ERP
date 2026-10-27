import { test, expect } from "@playwright/test";
import { iskeletGercekleEslesir, iskeletiAc } from "../helpers";

/**
 * ADR-009 — masaüstü (fare) compact ritim: tablo satırı, başlık ve araç çubuğu 32 px;
 * dokunmatik genişletmeler masaüstünde devreye girmez; en geniş tablolarda sayfa yatay kaymaz.
 */

const yakin = (deger: number, hedef: number) => expect(Math.abs(deger - hedef)).toBeLessThanOrEqual(1.5);

test("masaüstünde tablo satırı, başlık, hap ve sayfalama 32 px", async ({ page }) => {
  await page.goto("/orders?per=1");
  const tablo = page.getByRole("table");
  await expect(tablo.getByRole("columnheader").first()).toBeVisible();
  yakin((await tablo.getByRole("columnheader").first().boundingBox())!.height, 32);
  yakin((await tablo.getByRole("row").nth(1).getByRole("cell").first().boundingBox())!.height, 32);
  yakin((await page.getByRole("link", { name: "Tümü", exact: true }).boundingBox())!.height, 32);
  yakin((await page.getByRole("navigation", { name: "Sayfalama" }).getByRole("link", { name: "Sonraki" }).boundingBox())!.height, 32);
});

test("masaüstünde kutucuk alanı büyümez", async ({ page }) => {
  await page.goto("/doctors");
  const kutucuk = page.getByRole("checkbox", { name: /seç$/ }).first();
  const alan = kutucuk.locator("xpath=ancestor::label[1]");
  await expect(kutucuk).toBeVisible();
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

test("masaüstünde form etiketi alanın solunda, kontrol ve buton 32 px", async ({ page }) => {
  await page.goto("/doctors/new");
  const alan = page.getByLabel("Branş");
  const etiket = page.locator('label[for="specialty"]');
  await expect(alan).toBeVisible();
  const [a, e] = [(await alan.boundingBox())!, (await etiket.boundingBox())!];
  expect(e.x + e.width, "etiket alanın solunda").toBeLessThanOrEqual(a.x);
  expect(Math.abs(e.y + e.height / 2 - (a.y + a.height / 2)), "aynı satırda").toBeLessThanOrEqual(2);
  yakin(a.height, 32);
  const buton = (await page.getByRole("button", { name: "Cariyi Aç" }).boundingBox())!;
  yakin(buton.height, 32);
  expect(buton.width, "masaüstünde tam genişlik değil").toBeLessThan(300);
});

test("Düzenle ve Sil ikon + metin: ikon dekoratif, erişilebilir ad metin", async ({ page }) => {
  await page.goto("/products");
  const satir = page.getByRole("row").filter({ has: page.getByRole("link", { name: "Düzenle" }) }).first();
  for (const dugme of [satir.getByRole("link", { name: "Düzenle", exact: true }), satir.getByRole("button", { name: "Sil", exact: true })]) {
    await expect(dugme.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    const [ikon, kutu] = [(await dugme.locator("svg").boundingBox())!, (await dugme.boundingBox())!];
    expect(ikon.width, "ikon yazıyla orantılı").toBeGreaterThanOrEqual(14);
    expect(Math.abs(ikon.y + ikon.height / 2 - (kutu.y + kutu.height / 2)), "ikon dikeyde ortalı").toBeLessThanOrEqual(1.5);
  }
});

test.describe("yükleme iskeleti ve hareket", () => {
  test("1280 px: iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
    await iskeletGercekleEslesir(page, "/products");
  });

  test.describe("768 px", () => {
    test.use({ viewport: { width: 768, height: 1024 } });
    test("iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
      await iskeletGercekleEslesir(page, "/products");
    });
  });

  test("iskelet nabzı yavaş ve linear değil; içerik 180 ms opaklıkla gelir", async ({ page }) => {
    await iskeletiAc(page, "/products");
    const cubuk = page.getByRole("main").getByRole("status").locator('[aria-hidden="true"]').first();
    const nabiz = await cubuk.evaluate((e) => {
      const s = getComputedStyle(e);
      return { ad: s.animationName, sure: parseFloat(s.animationDuration), egri: s.animationTimingFunction };
    });
    expect(nabiz.ad).toBe("skeleton-pulse");
    expect(nabiz.sure).toBeGreaterThanOrEqual(1.5);
    expect(nabiz.egri).not.toBe("linear");

    await page.goto("/products");
    await expect(page.getByRole("heading", { level: 1, name: "Ürünler" })).toBeVisible();
    const gecis = await page.getByRole("main").evaluate((m) => {
      const s = getComputedStyle(m.firstElementChild!);
      return { ad: s.animationName, sure: parseFloat(s.animationDuration) };
    });
    expect(gecis).toEqual({ ad: "fade-in", sure: 0.18 });
  });

  test("azaltılmış harekette animasyon yok, uygulama çalışır", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await iskeletiAc(page, "/products");
    const cubuk = page.getByRole("main").getByRole("status").locator('[aria-hidden="true"]').first();
    expect(await cubuk.evaluate((e) => parseFloat(getComputedStyle(e).animationDuration))).toBeLessThan(0.001);

    await page.goto("/dashboard");
    await page.getByRole("navigation", { name: "Ana menü" }).getByRole("link", { name: "Ürünler" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ürünler" })).toBeVisible();
    expect(
      await page.getByRole("main").evaluate((m) => parseFloat(getComputedStyle(m.firstElementChild!).animationDuration))
    ).toBeLessThan(0.001);
  });
});
