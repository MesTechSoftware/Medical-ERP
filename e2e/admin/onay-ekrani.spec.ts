import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu, stoksuzSiparis } from "../helpers";

/** Ü-25 — onay ekranı: KPI (A-8-11), sekmeler, karar paneli (A-8-12), sütun seçici. */

const kpi = (page: Page) => page.getByRole("region", { name: "Onay sayıları" });
const satirlar = (page: Page) => page.getByRole("table", { name: "Onay talepleri" }).locator("tbody tr:has(a[data-kayit])");

async function blokAc(siparisId: string, saatOnce: number) {
  const [ops] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'OPERASYON' LIMIT 1`);
  const id = `e2e-blok-${siparisId}-${saatOnce}`;
  await sorgu(
    `INSERT INTO "ApprovalBlock" (id, "documentType", "documentId", "ruleCode", "openedById", "openReason", "openedAt")
     VALUES ($1, 'SIP', $2, 'NEGATIF_STOK', $3, 'Acil vaka e2e', now() - ($4 || ' hours')::interval)`,
    [id, siparisId, ops.id, String(saatOnce)]
  );
  return id;
}

test("24 saatten eski kartı süzgeci açar; kart = satır (A-8-11)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await blokAc(s.siparisId, 25);
  await page.goto("/approvals");
  const kart = kpi(page).getByRole("link", { name: "24 saatten eski" });
  // Etiketin kendisi "24" taşır: değer, yalnız rakamdan oluşan satırdır.
  const deger = Number((await kart.innerText()).split("\n").map((t) => t.trim()).find((t) => /^\d+$/.test(t)));
  expect(deger).toBeGreaterThan(0);
  await kart.click();
  await expect(page).toHaveURL(/\/approvals\?eski=1$/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText("24 saatten eski")).toBeVisible();
  // Kart sayısı sayfa boyunu aşabilir: aynı süzgeç tek sayfada.
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(deger);
});

test("panelde negatif stok bağlamı; notla red → Reddedilen sekmesinde not görünür (A-8-12)", async ({ page }) => {
  const s = await stoksuzSiparis();
  const blokId = await blokAc(s.siparisId, 1);
  // Bekleyenler en eski önce: yeni talep sonraki sayfada olabilir, belge numarasıyla süzülür.
  await page.goto(`/approvals?q=${s.documentNo}`);
  await satirlar(page).filter({ hasText: s.documentNo }).getByRole("link", { name: "Karar Ver" }).click();
  const panel = page.getByRole("dialog");
  const stok = panel.getByRole("region", { name: "Stok durumu" });
  await expect(stok).toContainText(s.urunAdi);
  await expect(stok.getByText("yetmiyor")).toBeVisible();
  await panel.getByLabel("Karar notu").fill("Stok gelmeden sevk yok");
  await panel.getByRole("button", { name: "Reddet" }).click();
  await expect(panel.locator(`[data-blok-id="${blokId}"]`)).toHaveCount(0);
  await expect(panel.getByRole("region", { name: "Karar" })).toContainText("Stok gelmeden sevk yok");

  await page.goto("/approvals?durum=RED");
  await expect(satirlar(page).filter({ hasText: s.documentNo })).toContainText("Reddedildi");
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "onay-sutunlar" });
  });

  test("Gerekçe sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: "Gerekçe" });
    await page.goto("/approvals?durum=tumu");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Gerekçe").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("adres kenarları: sayfa dışı son sayfaya, olmayan açan düşer", async ({ page }) => {
  const s = await stoksuzSiparis();
  await blokAc(s.siparisId, 2);
  await page.goto("/approvals?durum=tumu&page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await page.goto("/approvals?acan=cm0000000000000000000000x&durum=RED");
  await expect(page).toHaveURL(/\/approvals\?durum=RED$/);
});

test("KPI kartları taşmaz; iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
  await page.goto("/approvals");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/approvals");
});
