import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu } from "../helpers";

/** Ü-30 — içe aktarım ekranı: KPI (X-12-2), durum sekmeleri, sütun seçici, adres kenarları. */

const kpi = (page: Page) => page.getByRole("region", { name: "Parti sayıları" });
const satirlar = (page: Page) => page.getByRole("table", { name: "Partiler" }).locator("tbody tr[data-parti]");

async function parti(geriAlindi = false) {
  const [u] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'YONETICI' LIMIT 1`);
  const no = `CARI-E2E-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  await sorgu(
    `INSERT INTO "ImportBatch" (id, "batchNo", "dataType", "userId", "fileName", "revertedAt", "revertedById", "revertReason")
     VALUES ($1, $1, 'CARI', $2, 'e2e.xlsx', ${geriAlindi ? "now(), $2, 'e2e'" : "NULL, NULL, NULL"})`,
    [no, u.id]
  );
  return no;
}

test("geri alındı kartı süzgeci açar; kart = satır (X-12-2)", async ({ page }) => {
  await parti(true);
  await page.goto("/imports");
  const kart = kpi(page).getByRole("link", { name: /Geri alındı/ });
  const deger = parseInt((await kart.innerText()).split("\n").map((t) => t.trim()).find((t) => /^\d+$/.test(t)) ?? "", 10);
  expect(deger).toBeGreaterThan(0);
  await kart.click();
  await expect(page).toHaveURL(/\/imports\?durum=geri-alindi$/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText("Durum: Geri alındı")).toBeVisible();
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(deger);
});

test("Yazıldı sekmesi geri alınmış partiyi göstermez", async ({ page }) => {
  const geri = await parti(true);
  const yazili = await parti(false);
  await page.goto("/imports");
  await page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: "Yazıldı" }).click();
  await expect(page).toHaveURL(/durum=yazildi/);
  await expect(page.locator(`tr[data-parti="${yazili}"]`)).toBeVisible();
  await expect(page.locator(`tr[data-parti="${geri}"]`)).toHaveCount(0);
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "ice-aktarim-sutunlar" });
  });

  test("Dosya sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    await parti();
    const baslik = () => page.getByRole("columnheader", { name: "Dosya" });
    await page.goto("/imports");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Dosya").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("adres kenarları ve yeni içe aktarım bağlantısı", async ({ page }) => {
  await parti();
  await page.goto("/imports?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await page.goto("/imports?detay=olmayan-parti");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Yeni İçe Aktarım" }).click();
  await expect(page).toHaveURL(/\/imports\/new$/);
  await expect(page.getByRole("button", { name: "Doğrula ve önizle" })).toBeVisible();
});

test("KPI kartları taşmaz; iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
  await page.goto("/imports");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/imports");
});
