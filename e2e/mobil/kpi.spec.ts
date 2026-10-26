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

test("dashboard KPI iskeleti gerçek yerleşimle kart kart eşleşir", async ({ page }) => {
  await kpiIskeletiEslesir(page, "/dashboard");
});
