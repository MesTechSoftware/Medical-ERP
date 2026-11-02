import { test, expect, type Page } from "@playwright/test";
import { sorgu } from "../helpers";

/** X-10-2 (satır yazımı) · Ü-21 — fiyat listesi ekranı: KPI, sekmeler, sütun seçici, yan panel, barem matrisi (X-10-5, X-10-6). */

const kpi = (page: Page) => page.getByRole("region", { name: "Fiyat listesi sayıları" });
const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
/** Listenin veri satırları: panel bağlantısını taşıyan satırlar (başlık ve boş durum hariç). */
const listeSatirlari = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");

async function yeniListe(page: Page, ad = "E2E Liste") {
  const kod = `E2E-${Date.now().toString().slice(-8)}`;
  await page.goto("/price-lists");
  await page.getByRole("link", { name: "Yeni Liste" }).first().click();
  await expect(page).toHaveURL(/\/price-lists\/new$/);
  await page.getByLabel("Kod").fill(kod.toLowerCase());
  await page.getByLabel("Ad").fill(ad);
  await page.getByRole("button", { name: "Liste Oluştur" }).click();
  await expect(page.getByRole("heading", { name: `${kod} — ${ad}` })).toBeVisible();
  return kod;
}

test("yeni liste ayrı sayfada; oluşturunca detaya gider; barem satırı matriste görünür ve güncellenir (X-10-2, X-10-5)", async ({ page }) => {
  const kod = await yeniListe(page);
  await expect(page).toHaveURL(/\/price-lists\/(?!new)[^/?]+$/);
  await expect(page.getByText("Bu listede bugün geçerli satır yok.")).toBeVisible();

  const urun = page.getByLabel("Ürün");
  await urun.selectOption({ index: 1 });
  await page.getByLabel("Min. adet").fill("10");
  await page.getByLabel(/Liste fiyatı/).fill("80");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Satır kaydedildi.")).toBeVisible();

  const matris = page.locator("[data-barem-matrisi]");
  await expect(matris.getByRole("columnheader", { name: "10+" })).toBeVisible();
  await expect(matris.locator("tbody tr")).toHaveCount(1);
  await expect(matris.locator("tbody tr")).toContainText("80,00");

  await urun.selectOption({ index: 1 });
  await page.getByLabel("Min. adet").fill("10");
  await page.getByLabel(/Liste fiyatı/).fill("75");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(matris.locator("tbody tr")).toContainText("75,00");
  await expect(page.locator("tbody tr[data-satir-id]")).toHaveCount(1);

  const satirlar = await sorgu<{ minQuantity: number; listPrice: string }>(
    `SELECT i."minQuantity", i."listPrice"::text FROM "PriceListItem" i JOIN "PriceList" l ON l.id = i."priceListId" WHERE l.code = $1`,
    [kod]
  );
  expect(satirlar).toEqual([{ minQuantity: 10, listPrice: "75.0000" }]);
});

test("kod yan paneli açar: özet, barem matrisi, atanmış cariler; Satırları düzenle detaya gider", async ({ page }) => {
  const [v] = await sorgu<{ id: string; code: string }>(`SELECT id, code FROM "PriceList" WHERE code = 'VARSAYILAN'`);
  await page.goto("/price-lists?per=100");
  await page.getByRole("link", { name: v.code, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`detay=${v.id}`));
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: v.code })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Özet" })).toContainText("bugün geçerli");
  await expect(panel.getByRole("region", { name: "Barem matrisi" }).locator("[data-barem-matrisi] tbody tr").first()).toBeVisible();
  await expect(panel.getByRole("region", { name: "Atanmış cariler" })).toBeVisible();
  await panel.getByRole("link", { name: "Satırları düzenle" }).click();
  await expect(page).toHaveURL(new RegExp(`/price-lists/${v.id}$`));
});

test("Aktif liste kartı Aktif sekmesini açar; kart sayısı satır sayısına eşit (X-10-6)", async ({ page }) => {
  await page.goto("/price-lists");
  const kart = kpi(page).getByRole("link", { name: /Aktif liste/ });
  const deger = Number((await kart.innerText()).match(/\d+/)![0]);
  await kart.click();
  await expect(page).toHaveURL(/durum=aktif/);
  await expect(etkinler(page).getByText("Durum: Aktif")).toBeVisible();
  await page.goto("/price-lists?durum=aktif&per=100");
  await expect(listeSatirlari(page)).toHaveCount(deger);
});

test("satırsız yeni liste Boş sekmesinde; etiket × ile kaldırılır", async ({ page }) => {
  const kod = await yeniListe(page, "Satırsız liste");
  await page.goto("/price-lists?per=100");
  await page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: "Boş" }).click();
  await expect(page).toHaveURL(/durum=bos/);
  await page.goto("/price-lists?durum=bos&per=100");
  await expect(listeSatirlari(page).filter({ hasText: kod })).toHaveCount(1);
  await expect(listeSatirlari(page).filter({ hasText: kod }).getByText("Boş", { exact: true })).toBeVisible();
  await etkinler(page).getByRole("link", { name: "Kaldır: Durum: Boş" }).click();
  await expect(page).not.toHaveURL(/durum=/);
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "fiyat-listesi-sutunlar" });
  });

  test("Barem sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const barem = () => page.getByRole("columnheader", { name: "Barem", exact: true });
    await page.goto("/price-lists");
    await expect(barem()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Barem").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(barem()).toHaveCount(0);
    await page.reload();
    await expect(barem()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(barem()).toBeVisible();
  });
});

test("sayfa dışı adres son sayfaya gider; boş durum çıkmaz", async ({ page }) => {
  await page.goto("/price-lists?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await expect(listeSatirlari(page).first()).toBeVisible();
  await expect(page.getByText("Henüz fiyat listesi yok.")).toHaveCount(0);
});
