import { test, expect } from "@playwright/test";

/** Ü-19 — ürün listesi: KPI kartları, süzgeç sekmeleri, sütun seçici, boş durum (Ü-3-2). */

const kpi = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Ürün sayıları" });
const etkinler = (page: import("@playwright/test").Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
/** Veri satırları: ürün bağlantısını taşıyan satırlar (başlık ve boş durum hariç). */
const urunSatirlari = (page: import("@playwright/test").Page) => page.locator("tbody tr:has(a[data-kayit])");

test("kritik stok KPI kartı süzgeci uygular", async ({ page }) => {
  await page.goto("/products");
  const kart = kpi(page).getByRole("link", { name: /Kritik stok/ });
  const deger = Number((await kart.innerText()).match(/\d+/)![0]);
  await kart.click();
  await expect(page).toHaveURL(/durum=AKTIF&stok=kritik/);
  await expect(etkinler(page).getByText("Durum: Aktif")).toBeVisible();
  await expect(etkinler(page).getByText("Stok: Kritik")).toBeVisible();
  // Kart sayısı ile satır sayısı aynıdır (spec §3.1); sayfa boyu bütün satırları alır.
  await page.goto("/products?durum=AKTIF&stok=kritik&per=100");
  await expect(urunSatirlari(page)).toHaveCount(deger);
});

test("etiket × ile kaldırılır", async ({ page }) => {
  await page.goto("/products?durum=AKTIF&stok=kritik");
  await etkinler(page).getByRole("link", { name: "Kaldır: Stok: Kritik" }).click();
  await expect(page).toHaveURL(/durum=AKTIF/);
  await expect(page).not.toHaveURL(/stok=/);
  await expect(etkinler(page).getByText("Stok: Kritik")).toHaveCount(0);
});

const sutunMenusu = async (page: import("@playwright/test").Page) => {
  await page.getByText("Sütunlar", { exact: true }).click();
  return page.getByRole("form", { name: "Görünür sütunlar" });
};

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "urun-sutunlar" });
  });

  test("KDV dahil sütunu varsayılan gizli; açılınca kalıcı (Ü-3-2)", async ({ page }) => {
    const dahil = () => page.getByRole("columnheader", { name: "Liste Fiyatı (KDV dahil)" });
    await page.goto("/products");
    await expect(page.getByRole("columnheader", { name: "Liste Fiyatı (KDV hariç)" })).toBeVisible();
    await expect(dahil()).toHaveCount(0);

    const menu = await sutunMenusu(page);
    await menu.getByLabel("Liste Fiyatı (KDV dahil)").check();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(dahil()).toBeVisible();

    await page.reload();
    await expect(dahil()).toBeVisible();

    await (await sutunMenusu(page)).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(dahil()).toHaveCount(0);
  });
});

test("süzgece uyan ürün yoksa boş durum ve temizleme", async ({ page }) => {
  await page.goto("/products?durum=PASIF&stok=tukendi");
  await expect(page.getByText("Bu süzgeçlere uyan ürün bulunamadı.")).toBeVisible();
  await page.getByRole("link", { name: "Süzgeçleri temizle" }).click();
  await expect(page).toHaveURL(/\/products$/);
});
