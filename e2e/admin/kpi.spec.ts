import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu } from "../helpers";

/** ADR-010 — masaüstü (fare) KPI yerleşimi ve içeriği; yerleşim satırın kendi genişliğinden (KpiSatiri). */

const DASHBOARD_KPI = ["Ciro", "Tahsilat", "Bekleyen sipariş", "Kargolanacak"];
const kutular = (page: Page) =>
  Promise.all(DASHBOARD_KPI.map(async (ad) => (await page.getByRole("group", { name: ad, exact: true }).boundingBox())!));

test("dashboard 1280 px: dört KPI tek sırada, birincil iki birim; taban etiketi ve karşılaştırma notu yazılı", async ({ page }) => {
  await page.goto("/dashboard");
  const ciro = page.getByRole("group", { name: "Ciro", exact: true });
  await expect(ciro).toContainText("KDV hariç");
  await expect(ciro).toContainText("Bu ay · geçen ayın aynı günlerine göre");
  await expect(page.getByRole("group", { name: "Tahsilat", exact: true })).toContainText("KDV dahil");
  await expect(page.getByRole("group", { name: "Bekleyen sipariş" })).toContainText("şu an");
  const [c, t, b, k] = await kutular(page);
  expect(Math.max(c.y, t.y, b.y, k.y) - Math.min(c.y, t.y, b.y, k.y), "tek sıra").toBeLessThanOrEqual(1);
  expect(c.width, "birincil iki birim").toBeGreaterThan(t.width * 1.8);
  await kpiKartlariTasmaz(page);
});

test.describe("1024 px (orta düzen)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("birincil tam satır, diğer üçü aynı sırada; değerler kartında", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const satir = (await page.locator("[data-kpi-satiri]").boundingBox())!;
    const [c, t, b, k] = await kutular(page);
    expect(Math.abs(c.width - satir.width), "birincil tam genişlik").toBeLessThanOrEqual(2);
    expect(Math.max(t.y, b.y, k.y) - Math.min(t.y, b.y, k.y), "diğerleri aynı sırada").toBeLessThanOrEqual(1);
    expect(t.y, "diğerleri birincilin altında").toBeGreaterThan(c.y);
    await kpiKartlariTasmaz(page);
  });

  test("dashboard KPI iskeleti gerçek yerleşimle kart kart eşleşir", async ({ page }) => {
    await kpiIskeletiEslesir(page, "/dashboard");
  });
});

test("dashboard ve raporlar KPI iskeleti gerçek yerleşimle kart kart eşleşir (1280 px)", async ({ page }) => {
  await kpiIskeletiEslesir(page, "/dashboard");
  await kpiIskeletiEslesir(page, "/reports");
});

test("raporlar: dönem KPI'ları; tüm zamanlarda karşılaştırma yok; satıcı tablosunda son 6 ay", async ({ page }) => {
  await page.goto("/reports");
  const ciro = page.getByRole("group", { name: "Dönem Cirosu" });
  await expect(ciro).toContainText("KDV hariç");
  await expect(ciro).toContainText("geçen ayın aynı günlerine göre");
  await expect(page.getByRole("group", { name: "Dönem Tahsilatı" })).toContainText("KDV dahil");
  await expect(page.getByRole("group", { name: "Dönem Hakedişi" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Dönem İadesi" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Son 6 ay" })).toBeVisible();
  await kpiKartlariTasmaz(page);

  await page.goto("/reports?donem=tum");
  await expect(page.getByRole("group", { name: "Dönem Cirosu" })).not.toContainText("göre");
});

test("doktor detayı: Cari Bakiye birincil KPI, yön etiketiyle; sorumlu satıcı bilgi kartında", async ({ page }) => {
  const [d] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" ORDER BY "createdAt" LIMIT 1`);
  await page.goto(`/doctors/${d.id}`);
  const bakiye = page.getByRole("group", { name: "Cari Bakiye" });
  await expect(bakiye).toContainText("KDV dahil");
  await expect(bakiye).toContainText(/Doktor borçlu|Doktor alacaklı|Bakiye kapalı/);
  await expect(page.getByText("Sorumlu satıcı")).toBeVisible();
  await kpiKartlariTasmaz(page);
});
