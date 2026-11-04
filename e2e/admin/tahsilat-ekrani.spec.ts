import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu, unique } from "../helpers";

/** Ü-26 — tahsilat ekranı: KPI = süzgeç toplamı (A-11-2), tahsilat paneli ve gerekçeli iptal (A-11-3), sütun seçici. */

const kpi = (page: Page) => page.getByRole("region", { name: "Tahsilat sayıları" });
const tablo = (page: Page) => page.getByRole("table", { name: "Tahsilatlar" });

/** Bugün kaydedilmiş bir POS tahsilatı (cari hareketsiz; panel ve liste için yeterli). */
async function posTahsilati() {
  const [d] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" WHERE status = 'AKTIF' ORDER BY "fullName" LIMIT 1`);
  const [m] = await sorgu<{ id: string }>(`SELECT id FROM "PaymentMethod" WHERE type = 'POS' LIMIT 1`);
  const [u] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'YONETICI' LIMIT 1`);
  const id = unique("e2e-ths");
  const documentNo = unique("THS-E2E");
  await sorgu(
    `INSERT INTO "DoctorPayment" (id, "documentNo", "doctorId", amount, "paymentMethodId", "commissionRate", "commissionAmount", "recordedBy", "updatedAt")
     VALUES ($1, $2, $3, 5000, $4, 2.5, 125, $5, now())`,
    [id, documentNo, d.id, m.id, u.id]
  );
  return { id, documentNo };
}

test("POS kartı süzgeci açar; tablo altı toplam kartın tutarıdır (A-11-2)", async ({ page }) => {
  await posTahsilati();
  await page.goto("/collections");
  const kart = kpi(page).getByRole("link").filter({ hasText: "POS" });
  // Değer satırı; altındaki taban satırı ("KDV dahil") ayrıdır.
  const tutar = (await kart.getByText(/^₺/).first().innerText()).split("\n")[0].trim();
  await kart.click();
  await expect(page).toHaveURL(/\/collections\?baslangic=\d{4}-\d{2}-01&bitis=\d{4}-\d{2}-\d{2}&tip=POS$/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText("Yöntem: POS")).toBeVisible();
  await page.goto(`${page.url()}&per=100`);
  await expect(tablo(page).locator("tfoot")).toContainText(tutar);
});

test("panel donmuş komisyonu gösterir; iptal gerekçe ister, gerekçe İptal süzgecinde görünür (A-11-3)", async ({ page }) => {
  const t = await posTahsilati();
  await page.goto(`/collections?q=${t.documentNo}`);
  await tablo(page).getByRole("link", { name: "İncele" }).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("region", { name: "Komisyon" })).toContainText("%2,5");

  page.on("dialog", (d) => d.accept());
  const form = panel.locator(`form[data-payment-id="${t.id}"]`);
  await form.getByLabel("Gerekçe").fill("   ");
  await form.getByRole("button", { name: "Tahsilatı iptal et" }).click();
  await expect(form.getByText("Gerekçe zorunludur.")).toBeVisible();
  await form.getByLabel("Gerekçe").fill("Dekont hatalı");
  await form.getByRole("button", { name: "Tahsilatı iptal et" }).click();
  await expect(panel.getByRole("region", { name: "İptal" })).toContainText("Dekont hatalı");

  await page.goto(`/collections?q=${t.documentNo}`);
  await expect(tablo(page).getByText(t.documentNo)).toHaveCount(0);
  await page.goto(`/collections?durum=IPTAL&q=${t.documentNo}`);
  await expect(tablo(page).getByText(t.documentNo)).toBeVisible();
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "tahsilat-sutunlar" });
  });

  test("Komisyon sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    await posTahsilati();
    const baslik = () => page.getByRole("columnheader", { name: /^Komisyon/ });
    await page.goto("/collections");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Komisyon").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("adres kenarları: sayfa dışı son sayfaya, bulunmayan tahsilat panel açmaz", async ({ page }) => {
  await posTahsilati();
  await page.goto("/collections?durum=tumu&page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await page.goto("/collections?detay=olmayan-tahsilat");
  await expect(tablo(page)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("KPI kartları taşmaz; iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
  await page.goto("/collections");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/collections");
});
