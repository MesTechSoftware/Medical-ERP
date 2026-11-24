import { test, expect, type Page } from "@playwright/test";
import { SEED_SELLER_NAME, sorgu } from "../helpers";

/** Ü-23 — siparişler ekranı: sekme sayıları (A-5-8), sekmeler, Filtrele, sütun seçici, yan panel (A-3-2). */

const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
const sekmeler = (page: Page) => page.getByRole("navigation", { name: "Hızlı süzgeçler" });
const satirlar = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");
const sekme = (page: Page, ad: RegExp) => sekmeler(page).getByRole("link", { name: ad });
const sayi = async (l: import("@playwright/test").Locator) => Number((await l.innerText()).match(/\d+/)![0]);
const para = (metin: string) => metin.match(/[\d.]+,\d{2}/)![0];

test("sekme sayısı o sekmenin satır sayısıdır; sekme dönemi ve süzgeci korur (A-5-8)", async ({ page }) => {
  await page.goto("/orders?baslangic=2020-01-01&bitis=2099-12-31");
  await expect(page.locator("[data-donem]")).toContainText("Dönem:");
  const bekliyor = sekme(page, /^Bekliyor/);
  const deger = await sayi(bekliyor);
  expect(deger).toBeGreaterThan(0);
  await bekliyor.click();
  await expect(page).toHaveURL(/durum=BEKLIYOR&baslangic=2020-01-01&bitis=2099-12-31/);
  await expect(etkinler(page).getByText("Durum: Bekliyor")).toBeVisible();
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(Math.min(deger, 100));
  // Etkin sekmenin sayısı da aynıdır; Tümü teklifi de sayar: durum sekmelerinin toplamından az olamaz.
  expect(await sayi(sekme(page, /^Bekliyor/))).toBe(deger);
  const toplam = await sayi(sekme(page, /^Tümü/));
  let durumlar = 0;
  for (const ad of [/^Bekliyor/, /^Hazırlanıyor/, /^Kargolandı/, /^Teslim Edildi/, /^İptal/]) durumlar += await sayi(sekme(page, ad));
  expect(toplam).toBeGreaterThanOrEqual(durumlar);
});

test("teklif durum sekmelerine girmez; Tümü sayısına girer ve çipiyle listelenir (A-5-8, B-6)", async ({ page }) => {
  const [d] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" ORDER BY "createdAt" LIMIT 1`);
  const no = `SIP-E2E-TEKLIF-${Date.now()}`;
  await page.goto("/orders");
  const bekliyor = await sayi(sekme(page, /^Bekliyor/));
  const tumu = await sayi(sekme(page, /^Tümü/));
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", stage, status, "paymentTermDays", "orderDate", "updatedAt")
     VALUES ($1, $2, $3, 'TEKLIF', 'BEKLIYOR', 30, now(), now())`,
    [`e2e-teklif-${Date.now()}`, no, d.id]
  );
  try {
    await page.reload();
    expect(await sayi(sekme(page, /^Bekliyor/))).toBe(bekliyor);
    expect(await sayi(sekme(page, /^Tümü/))).toBe(tumu + 1);
    await expect(sekmeler(page).getByRole("link", { name: "Teklif", exact: true })).toHaveCount(0);
    await page.goto(`/orders?q=${no}`);
    const satir = satirlar(page).first();
    await expect(satir).toContainText(no);
    await expect(satir.getByText("Teklif", { exact: true })).toBeVisible();
    // Teklifin durum sütunu "Bekliyor" demez: Bekliyor sekmesi teklifi saymaz.
    await expect(satir.getByText("Bekliyor", { exact: true })).toHaveCount(0);
    // İptal edilen teklif de "İptal Edildi" demez: İptal sekmesi yalnız onaylı siparişi sayar.
    await sorgu(`UPDATE "Order" SET status = 'IPTAL' WHERE "documentNo" = $1`, [no]);
    await page.reload();
    await expect(satirlar(page).first().getByText("Teklif (iptal)", { exact: true })).toBeVisible();
    await expect(satirlar(page).first().getByText("İptal Edildi", { exact: true })).toHaveCount(0);
  } finally {
    await sorgu(`DELETE FROM "Order" WHERE "documentNo" = $1`, [no]);
  }
});

test("Filtrele: satıcı süzgeci etiketlenir, satırlar o satıcının; × ile kalkar", async ({ page }) => {
  await page.goto("/orders?per=50");
  await page.getByText("Filtrele", { exact: true }).click();
  const form = page.getByRole("form", { name: "Sipariş süzgeci" });
  await form.getByLabel("Satıcı").selectOption({ label: SEED_SELLER_NAME });
  await form.getByRole("button", { name: "Uygula" }).click();
  await expect(page).toHaveURL(/satici=[^&]+/);
  await expect(page).toHaveURL(/per=50/);
  await expect(etkinler(page).getByText(`Satıcı: ${SEED_SELLER_NAME}`)).toBeVisible();
  const n = await satirlar(page).count();
  expect(n).toBeGreaterThan(0);
  await expect(satirlar(page).filter({ hasText: SEED_SELLER_NAME })).toHaveCount(n);
  await etkinler(page).getByRole("link", { name: `Kaldır: Satıcı: ${SEED_SELLER_NAME}` }).click();
  await expect(page).not.toHaveURL(/satici=/);
});

test("yan panel: kalemler, sevkiyat (takip no) ve toplam detay sayfasıyla aynı (A-3-2)", async ({ page }) => {
  const [o] = await sorgu<{ id: string; documentNo: string }>(
    `SELECT o.id, o."documentNo" FROM "Order" o WHERE o.status = 'KARGOLANDI' AND EXISTS (SELECT 1 FROM "Shipment" s WHERE s."orderId" = o.id AND s."trackingNumber" IS NOT NULL AND s."carrierId" IS NOT NULL) ORDER BY o."orderDate" DESC LIMIT 1`
  );
  await page.goto(`/orders?detay=${o.id}`);
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: o.documentNo })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Kalemler" }).getByRole("columnheader", { name: "Kalan" })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Kalemler" }).getByRole("columnheader", { name: /^Birim fiyat/ })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Sevkiyatlar" })).toContainText(/SVK-.*/);
  await expect(panel.getByRole("region", { name: "Sevkiyatlar" })).toContainText("Takip:");
  const toplam = para(await panel.getByRole("region", { name: "Tutarlar" }).getByText(/Genel toplam/).locator("..").innerText());
  await panel.getByRole("link", { name: "Tam detay" }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${o.id}$`));
  const detay = page.locator("tfoot tr").filter({ hasText: /^Genel Toplam/ });
  expect(para(await detay.innerText())).toBe(toplam);
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "siparis-sutunlar" });
  });

  test("Satıcı sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: "Satıcı" });
    await page.goto("/orders");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Satıcı").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("adres kenarları: sayfa dışı son sayfaya, eski ?status= okunur, olmayan satıcı düşer", async ({ page }) => {
  await page.goto("/orders?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await expect(satirlar(page).first()).toBeVisible();

  await page.goto("/orders?status=IPTAL");
  await expect(sekmeler(page).getByRole("link", { name: /^İptal/ })).toHaveAttribute("aria-current", "page");
  await expect(etkinler(page).getByText("Durum: İptal")).toBeVisible();

  await page.goto("/orders?satici=cm0000000000000000000000x&durum=BEKLIYOR");
  await expect(page).toHaveURL(/\/orders\?durum=BEKLIYOR$/);
});

test("dashboard 'Sipariş durumları' dilimi aynı sayıyı açar (A-5-8)", async ({ page }) => {
  await page.goto("/dashboard?aralik=ay");
  // Başlığı ve dilim bağlantılarını birlikte taşıyan en içteki kutu: "Sipariş durumları" bloğu.
  const blok = page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: "Sipariş durumları", exact: true }) })
    .filter({ has: page.getByRole("link", { name: /^Bekliyor/ }) })
    .last();
  const dilim = blok.getByRole("link", { name: /^Bekliyor/ });
  const deger = Number((await dilim.innerText()).split("\n").map((s) => s.trim()).find((s) => /^\d+$/.test(s)));
  await dilim.click();
  await expect(page).toHaveURL(/\/orders\?durum=BEKLIYOR&baslangic=\d{4}-\d{2}-01&bitis=/);
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(deger);
  expect(await sayi(sekme(page, /^Bekliyor/))).toBe(deger);
});


/** A-5-9: KPI kart bloğu yok; tablo ilk ekranda; telefonda sekmeler yatay kayan şerit (yalnız şeridin scrollLeft'i kayar). */
async function tabloIlkEkranda(page: Page, yol: string) {
  await page.goto(yol);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-kpi-satiri]")).toHaveCount(0);
  const satir = page.locator("tbody tr:has(a[data-kayit])").first();
  await expect(satir).toBeVisible();
  const { y, yukseklik } = await satir.evaluate((e) => ({ y: e.getBoundingClientRect().y, yukseklik: e.getBoundingClientRect().height }));
  const ekran = page.viewportSize()!.height;
  expect(y + yukseklik, "ilk satır ilk ekranda").toBeLessThanOrEqual(ekran);
}

async function sekmeSeridiKayar(page: Page, yol: string) {
  await page.goto(yol);
  const serit = page.getByRole("navigation", { name: "Hızlı süzgeçler" });
  await expect(serit).toBeVisible();
  const olcu = await serit.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
  expect(olcu.sw, "şerit içeriği şeritten geniş (kayar)").toBeGreaterThan(olcu.cw);
  await serit.evaluate((e) => (e.scrollLeft = 200));
  expect(await serit.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
  const sayfa = await page.evaluate(() => ({ x: window.scrollX, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sayfa.x, "sayfa kaymaz").toBe(0);
  expect(sayfa.sw, "sayfa taşmaz").toBeLessThanOrEqual(sayfa.cw);
}

test.describe("1440 px dizüstü", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("KPI kart bloğu yok; tablo ilk ekranda; sekmelerde sayı ve dönem görünür (A-5-8, A-5-9)", async ({ page }) => {
    await tabloIlkEkranda(page, "/orders");
    await expect(sekme(page, /^Tümü\s*\d+$/)).toBeVisible();
    await expect(page.locator("[data-donem]")).toHaveText("Dönem: Tüm zamanlar");
  });
});

test.describe("390 px telefon", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("tablo ilk ekranda; sekmeler yatay kayan şerit, yalnız şerit kayar (A-5-9)", async ({ page }) => {
    await tabloIlkEkranda(page, "/orders");
    await sekmeSeridiKayar(page, "/orders");
  });
});
