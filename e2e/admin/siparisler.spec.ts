import { test, expect, type Page } from "@playwright/test";
import { SEED_SELLER_NAME, kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu } from "../helpers";

/** Ü-23 — siparişler ekranı: KPI (A-5-8), sekmeler, Filtrele, sütun seçici, yan panel (A-3-2). */

const kpi = (page: Page) => page.getByRole("region", { name: "Sipariş sayıları" });
const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
const sekmeler = (page: Page) => page.getByRole("navigation", { name: "Hızlı süzgeçler" });
const satirlar = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");
const sayi = async (l: import("@playwright/test").Locator) => Number((await l.innerText()).match(/\d+/)![0]);
const para = (metin: string) => metin.match(/[\d.]+,\d{2}/)![0];

test("Bekliyor kartı aralığıyla süzgeci açar; kart sayısı satır sayısına eşit (A-5-8)", async ({ page }) => {
  await page.goto("/orders");
  await expect(kpi(page).getByRole("link")).toHaveCount(5);
  const kart = kpi(page).getByRole("link", { name: /^Bekliyor/ });
  const deger = await sayi(kart);
  expect(deger).toBeGreaterThan(0);
  await kart.click();
  await expect(page).toHaveURL(/durum=BEKLIYOR&baslangic=\d{4}-\d{2}-01&bitis=\d{4}-\d{2}-\d{2}/);
  await expect(etkinler(page).getByText("Durum: Bekliyor")).toBeVisible();
  await expect(satirlar(page)).toHaveCount(Math.min(deger, 25));
  // Sayfa boyunu aşan aylarda da sayı tutar: aynı süzgeç tek sayfada.
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(deger);
});

test("teklif kartlara girmez; Teklif sekmesinde çipiyle listelenir (A-5-8)", async ({ page }) => {
  const [d] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" ORDER BY "createdAt" LIMIT 1`);
  const no = `SIP-E2E-TEKLIF-${Date.now()}`;
  await page.goto("/orders");
  const bekliyor = await sayi(kpi(page).getByRole("link", { name: /^Bekliyor/ }));
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", stage, status, "paymentTermDays", "orderDate", "updatedAt")
     VALUES ($1, $2, $3, 'TEKLIF', 'BEKLIYOR', 30, now(), now())`,
    [`e2e-teklif-${Date.now()}`, no, d.id]
  );
  try {
    await page.reload();
    expect(await sayi(kpi(page).getByRole("link", { name: /^Bekliyor/ }))).toBe(bekliyor);
    await sekmeler(page).getByRole("link", { name: "Teklif", exact: true }).click();
    await expect(page).toHaveURL(/durum=TEKLIF/);
    const satir = satirlar(page).first();
    await expect(satir).toContainText(no);
    await expect(satir.getByText("Teklif", { exact: true })).toBeVisible();
    // Teklifin durum sütunu "Bekliyor" demez: Bekliyor sekmesi ve kartı teklifi saymaz.
    await expect(satir.getByText("Bekliyor", { exact: true })).toHaveCount(0);
    // İptal edilen teklif de "İptal Edildi" demez: İptal sekmesi ve kartı yalnız onaylı siparişi sayar.
    await sorgu(`UPDATE "Order" SET status = 'IPTAL' WHERE "documentNo" = $1`, [no]);
    await page.reload();
    await expect(satirlar(page).first().getByText("Teklif (iptal)", { exact: true })).toBeVisible();
    await expect(satirlar(page).first().getByText("İptal Edildi", { exact: true })).toHaveCount(0);
    await page.getByText("Filtrele", { exact: true }).waitFor();
    await expect(page.getByText("Filtrele · 1")).toHaveCount(0);
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
  await expect(sekmeler(page).getByRole("link", { name: "İptal Edildi", exact: true })).toHaveAttribute("aria-current", "page");
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
  expect(await sayi(kpi(page).getByRole("link", { name: /^Bekliyor/ }))).toBe(deger);
});

const KARTLAR = ["Toplam sipariş", "Bekliyor", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal Edildi"];
const kartKutulari = (page: Page) =>
  Promise.all(KARTLAR.map(async (ad) => (await page.getByRole("group", { name: ad, exact: true }).boundingBox())!));

test("6 kart (ADR-010 eki) 1280 px: birincil tam satır, sonra 3 + 2; taşmaz; iskelet eşleşir", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("group", { name: "Toplam sipariş", exact: true })).toContainText("Bu ay · teklif hariç");
  const satir = (await page.locator("[data-kpi-satiri]").boundingBox())!;
  const [t, b, h, k, te, i] = await kartKutulari(page);
  expect(Math.abs(t.width - satir.width), "birincil tam genişlik").toBeLessThanOrEqual(2);
  expect(Math.max(b.y, h.y, k.y) - Math.min(b.y, h.y, k.y), "üçlü sıra").toBeLessThanOrEqual(1);
  expect(Math.abs(te.y - i.y), "ikili sıra").toBeLessThanOrEqual(1);
  expect(te.y).toBeGreaterThan(b.y);
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/orders");
});

test.describe("1600 px (geniş düzen)", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("6 kart tek sırada, birincil iki birim; taşmaz", async ({ page }) => {
    await page.goto("/orders");
    const kutular = await kartKutulari(page);
    const ys = kutular.map((k) => k.y);
    expect(Math.max(...ys) - Math.min(...ys), "tek sıra").toBeLessThanOrEqual(1);
    expect(kutular[0].width, "birincil iki birim").toBeGreaterThan(kutular[1].width * 1.8);
    await kpiKartlariTasmaz(page);
  });
});
