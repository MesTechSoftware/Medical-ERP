import { type Locator, type Page, expect } from "@playwright/test";

/** Telefon genişliği (md altı): nav şeridi görünür, yan menü gizlidir. */
export const telefonda = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

/** Sayfa yatay kaymaz; geniş içerik (tablo) yalnız kendi kutusunda kayar. */
export async function yatayTasmaYok(page: Page, yer = page.url()) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `${yer} yatay kaymamalı`).toBeLessThanOrEqual(clientWidth);
}

/**
 * Dokunma hedefi en az 44×44 px (dokunmatik cihaz). Önce görünürlük beklenir: akışla gelen
 * içerik DOM'a önce gizli eklenir, o anda ölçülen kutu `null` döner.
 */
export async function dokunmaHedefi(hedef: Locator, ad: string) {
  await expect(hedef, `${ad} görünür olmalı`).toBeVisible();
  const kutu = (await hedef.boundingBox())!;
  expect(kutu.height, `${ad} yüksekliği`).toBeGreaterThanOrEqual(44);
  expect(kutu.width, `${ad} genişliği`).toBeGreaterThanOrEqual(44);
}
