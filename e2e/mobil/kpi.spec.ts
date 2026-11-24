import { test, expect } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz } from "../helpers";

test.use({ storageState: "playwright/.auth/admin.json" });

/**
 * ADR-010 — dokunmatikte KPI yerleşimi. Telefonda ve iPad dikeyde (kenar çubuğuyla satır 522 px)
 * satır dar düzendedir: birincil tam satır, diğerleri 2'li. Yatay kaydırma yok, görünmeyen KPI yok.
 */
test("dashboard KPI: birincil tam satır, diğerleri 2'li; değerler kartında", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const satir = (await page.locator("[data-kpi-satiri]").boundingBox())!;
  const kutu = async (ad: string) => (await page.getByRole("group", { name: ad, exact: true }).boundingBox())!;
  const [ciro, tahsilat, bekleyen, kargo] = await Promise.all(["Ciro", "Tahsilat", "Bekleyen sipariş", "Kargolanacak"].map(kutu));
  expect(Math.abs(ciro.width - satir.width), "birincil tam genişlik").toBeLessThanOrEqual(2);
  expect(Math.abs(tahsilat.y - bekleyen.y), "2'li sıra").toBeLessThanOrEqual(1);
  expect(kargo.y, "üçüncü kart alt sırada").toBeGreaterThan(tahsilat.y);
  expect(Math.abs(kargo.x - tahsilat.x), "alt sıranın başında").toBeLessThanOrEqual(1);
  for (const k of [tahsilat, bekleyen, kargo]) expect(k.x + k.width, "satır içinde").toBeLessThanOrEqual(satir.x + satir.width + 1);
  await expect(page.getByRole("group", { name: "Ciro", exact: true })).toContainText("KDV hariç");
  await expect(page.getByRole("group", { name: "Tahsilat", exact: true })).toContainText("KDV dahil");
  await kpiKartlariTasmaz(page);
});

test("siparişler: KPI kart bloğu yok (A-5-9); tablo ilk ekranda, sayfa yana kaymaz", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-kpi-satiri]")).toHaveCount(0);
  const satir = page.locator("tbody tr:has(a[data-kayit])").first();
  await expect(satir).toBeVisible();
  const kutu = (await satir.boundingBox())!;
  expect(kutu.y + kutu.height, "ilk satır ilk ekranda").toBeLessThanOrEqual(page.viewportSize()!.height);
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test("dashboard KPI iskeleti gerçek yerleşimle kart kart eşleşir", async ({ page }) => {
  await kpiIskeletiEslesir(page, "/dashboard");
});

test("dashboard dokunmatikte öncelik sırası (brief §2): bloklar alt alta, akış en çok sevk edilenlerden önce; sayfa kaymaz", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const y = async (l: import("@playwright/test").Locator) => (await l.boundingBox())!.y;
  const baslik = (ad: string) => page.getByRole("heading", { name: ad, exact: true });
  const telefon = page.viewportSize()!.width < 768;
  const sira = [
    ...(telefon ? [page.getByRole("navigation", { name: "Zaman aralığı" })] : []),
    page.locator("[data-kpi-satiri]"),
    baslik("Sipariş durumları"),
    baslik("Kritik stok"),
    baslik("Dikkat gerektirenler"),
    baslik("Son hareketler"),
    baslik("En çok sevk edilen ürünler"),
    baslik("Sayfalar"),
  ];
  const ys: number[] = [];
  for (const l of sira) ys.push(await y(l));
  expect(ys).toEqual([...ys].sort((a, b) => a - b));
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
});
