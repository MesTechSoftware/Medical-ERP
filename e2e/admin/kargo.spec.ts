import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu, stoksuzSiparis } from "../helpers";

/** Ü-24 — kargo ekranı: KPI, toplu kargo (A-3-3), kısmi sevk paneli, sevkiyat listesi (D-3-2). */

const kpi = (page: Page) => page.getByRole("region", { name: "Kargo sayıları" });
const bekleyenSatiri = (page: Page, metin: string) => page.locator("tr[data-kargo-satiri]").filter({ hasText: metin });
const sevkiyatlar = (page: Page) => page.getByRole("table", { name: "Sevkiyatlar" });
const sevkSatirlari = (page: Page) => sevkiyatlar(page).locator("tbody tr:not(:has(td[colspan]))");

test("toplu kargo: iki sipariş, satır başına takip, ortak firma — sonuç sipariş başına, satırlar düşer (A-3-3)", async ({ page }) => {
  const a = await stoksuzSiparis({ stoklu: true });
  const b = await stoksuzSiparis({ stoklu: true });
  const ek = `${Date.now()}`.slice(-6);
  await page.goto("/shipping");
  for (const [s, takip] of [[a, `TRA${ek}`], [b, `TRB${ek}`]] as const) {
    const satir = bekleyenSatiri(page, s.doktorAdi);
    await satir.getByRole("checkbox").check();
    await satir.getByLabel(`${s.documentNo} takip no`).fill(takip);
  }
  const form = page.getByRole("form", { name: "Toplu kargo" });
  await form.getByLabel(/Kargo firması/).selectOption({ index: 1 });
  await form.getByRole("button", { name: "Seçilenleri kargola" }).click();

  const sonuc = page.getByRole("status", { name: "Toplu kargo sonucu" });
  await expect(sonuc).toContainText(a.documentNo);
  await expect(sonuc).toContainText(b.documentNo);
  await expect(sonuc.getByText(/SVK-.* yazıldı — sipariş kargolandı/)).toHaveCount(2);
  await expect(bekleyenSatiri(page, a.doktorAdi)).toHaveCount(0);
  await expect(bekleyenSatiri(page, b.doktorAdi)).toHaveCount(0);

  const [svk] = await sorgu<{ t: string; c: string | null }>(
    `SELECT "trackingNumber" AS t, "carrierId" AS c FROM "Shipment" WHERE "orderId" = $1`,
    [a.siparisId]
  );
  expect(svk).toEqual({ t: `TRA${ek}`, c: expect.any(String) });
  await page.goto(`/shipping?q=TRB${ek}`);
  await expect(sevkSatirlari(page)).toHaveCount(1);
  await expect(sevkSatirlari(page)).toContainText(b.doktorAdi);
});

test("toplu kargoda seçim yoksa hata; onay bloklu sipariş seçilemez", async ({ page }) => {
  const s = await stoksuzSiparis();
  await sorgu(
    `INSERT INTO "ApprovalBlock" (id, "documentType", "documentId", "ruleCode", "openedById", "openReason")
     SELECT $1, 'SIP', $2, 'NEGATIF_STOK', id, 'e2e' FROM "User" WHERE role = 'YONETICI' LIMIT 1`,
    [`e2e-blok-${s.siparisId}`, s.siparisId]
  );
  await page.goto("/shipping");
  await expect(bekleyenSatiri(page, s.doktorAdi).getByRole("checkbox")).toBeDisabled();
  await expect(bekleyenSatiri(page, s.doktorAdi).getByText("Onay bekliyor")).toBeVisible();
  const form = page.getByRole("form", { name: "Toplu kargo" });
  await form.getByRole("button", { name: "Seçilenleri kargola" }).click();
  await expect(form.getByRole("alert")).toContainText("Kargolanacak sipariş seçin.");
});

test("Bugün kargolanan kartı bugünün sevkiyat süzgecini açar; kart = satır (D-3-2)", async ({ page }) => {
  await page.goto("/shipping");
  const kart = kpi(page).getByRole("link", { name: "Bugün kargolanan" });
  const deger = Number((await kart.innerText()).match(/\d+/)![0]);
  await kart.click();
  await expect(page).toHaveURL(/baslangic=(\d{4}-\d{2}-\d{2})&bitis=\1/);
  await page.goto(`${page.url()}&per=100`);
  await expect(sevkSatirlari(page)).toHaveCount(deger);
  await expect(page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: "Bugün", exact: true })).toHaveAttribute("aria-current", "page");
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "kargo-sutunlar" });
  });

  test("Firma sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => sevkiyatlar(page).getByRole("columnheader", { name: "Firma" });
    await page.goto("/shipping");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Firma").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("adres kenarları: sayfa dışı son sayfaya, olmayan firma düşer, kargo beklemeyen kismi panel açmaz", async ({ page }) => {
  await page.goto("/shipping?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await page.goto("/shipping?firma=cm0000000000000000000000x&durum=KARGOLANDI");
  await expect(page).toHaveURL(/\/shipping\?durum=KARGOLANDI$/);
  const [o] = await sorgu<{ id: string }>(`SELECT id FROM "Order" WHERE status = 'KARGOLANDI' LIMIT 1`);
  await page.goto(`/shipping?kismi=${o.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Kargo" })).toBeVisible();
  await expect(page.locator("[data-sevk-karti]")).toHaveCount(0);
});

test("KPI kartları taşmaz; iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
  await page.goto("/shipping");
  await expect(kpi(page).getByRole("group", { name: "Kargo bekleyen" })).toContainText("adet kalan");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/shipping");
});
