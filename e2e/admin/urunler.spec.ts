import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";

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

/** Yan panel (spec §3.6) — X-18 §(9) kabuğu. */

test("ürün adı yan paneli açar; içerik; Esc ile kapanır, odak ada döner", async ({ page }) => {
  // Son 10 hareketinden biri sevkiyat olan, varsayılan listede satırı bulunan ürün.
  const [u] = await sorgu<{ id: string; name: string }>(
    `SELECT p.id, p.name FROM "Product" p
      WHERE EXISTS (SELECT 1 FROM (SELECT "shipmentId" FROM "StockMovement" m WHERE m."productId" = p.id
                                    ORDER BY m."createdAt" DESC, m.id DESC LIMIT 10) s WHERE s."shipmentId" IS NOT NULL)
        AND EXISTS (SELECT 1 FROM "PriceListItem" i JOIN "PriceList" l ON l.id = i."priceListId"
                     WHERE i."productId" = p.id AND l.code = 'VARSAYILAN')
      ORDER BY p.name LIMIT 1`
  );
  expect(u, "kurulumda sevkiyatlı ürün olmalı").toBeDefined();
  await page.goto("/products?per=100");
  await page.locator(`a[data-kayit="${u.id}"]`).click();
  const panel = page.getByRole("dialog", { name: u.name });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`detay=${u.id}`));
  await expect(panel.getByRole("region", { name: "Son stok hareketleri" }).getByText("Sevkiyat").first()).toBeVisible();
  await expect(panel.getByRole("region", { name: "Fiyat listeleri" }).getByText("VARSAYILAN")).toBeVisible();
  await expect(panel.getByRole("link", { name: "Düzenle" })).toHaveAttribute("href", `/products/${u.id}/edit`);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/detay=/);
  await expect(page.locator(`a[data-kayit="${u.id}"]`)).toBeFocused();
});

test("geçersiz detay kimliğinde panel açılmaz", async ({ page }) => {
  await page.goto("/products?detay=yok");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
});

test("pasif ürünün panelinde Stok girişi yok", async ({ page }) => {
  const [u] = await sorgu<{ id: string; name: string }>(
    `UPDATE "Product" SET status = 'PASIF' WHERE id = (SELECT id FROM "Product" WHERE status = 'AKTIF' ORDER BY name DESC LIMIT 1)
     RETURNING id, name`
  );
  try {
    await page.goto(`/products?detay=${u.id}`);
    const panel = page.getByRole("dialog", { name: u.name });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: "Stok girişi" })).toHaveCount(0);
  } finally {
    await sorgu(`UPDATE "Product" SET status = 'AKTIF' WHERE id = $1`, [u.id]);
  }
});

test("sayfa dışı adres son sayfaya gider; boş durum çıkmaz", async ({ page }) => {
  await page.goto("/products?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await expect(page.locator("a[data-kayit]").first()).toBeVisible();
  await expect(page.getByText("Henüz ürün yok.")).toHaveCount(0);
});
