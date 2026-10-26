import { test, expect } from "@playwright/test";
import { SEED_SELLER_NAME, kpiIskeletiEslesir, kpiKartlariTasmaz } from "../helpers";

/**
 * X-1-1 · D-2 §(1): satıcı kendi prim/hakedişini ekranda görür; kısıt sorgudadır —
 * tabloda yalnız kendi satırı vardır. Yönetim raporu satıcıya kapalıdır.
 */

test("Raporum yalnız kendi satırını gösterir", async ({ page }) => {
  await page.goto("/my-report");
  await expect(page.getByRole("heading", { name: "Raporum" })).toBeVisible();
  const satirlar = page.locator("tbody tr");
  await expect(satirlar).toHaveCount(1);
  await expect(satirlar.first()).toContainText(SEED_SELLER_NAME);
  await expect(page.getByText("Ayşe Demir")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Hakediş (KDV hariç)", exact: true })).toBeVisible();
});

test("Raporum KPI'ları satıcı kapsamında: Cirom, Hakedişim ve Tahsilatım tablodaki kendi satırıyla aynı (ADR-010)", async ({ page }) => {
  await page.goto("/my-report");
  const kart = (ad: string) => page.getByRole("group", { name: ad, exact: true });
  await expect(kart("Cirom")).toContainText("KDV hariç");
  await expect(kart("Hakedişim")).toContainText("KDV hariç");
  await expect(kart("Tahsilatım")).toContainText("KDV dahil");
  await expect(kart("Cirom")).toContainText("geçen ayın aynı günlerine göre");
  // KPI ve tablo ayrı yollardan okur (ciroOzeti / getSellerReports); kapsam aynıysa tutar aynıdır.
  const satir = page.locator("tbody tr");
  await expect(satir).toHaveCount(1);
  const tutar = (metin: string) => metin.match(/₺[\d.]+,\d{2}/)?.[0];
  for (const [ad, sutun] of [["Cirom", 1], ["Hakedişim", 2], ["Tahsilatım", 3]] as const) {
    expect(tutar(await kart(ad).innerText()), ad).toBe(tutar(await satir.locator("td").nth(sutun).innerText()));
  }
  await kpiKartlariTasmaz(page);
});

test("Raporum KPI iskeleti gerçek yerleşimle kart kart eşleşir", async ({ page }) => {
  await kpiIskeletiEslesir(page, "/my-report");
});

test("yönetim raporu satıcıya kapalıdır", async ({ page }) => {
  await page.goto("/reports");
  await expect(page).toHaveURL(/\/my-orders/);
});
