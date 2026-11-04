import { test, expect, type Page } from "@playwright/test";
import { SEED_SELLER_NAME } from "../helpers";

/** Ü-27 — Raporlar: doktor ciro sıralaması (X-1-2) — satıcıdan süzgeç, dönem değişince süzgeç korunur, sütun seçici. */

const siralama = (page: Page) => page.getByRole("table", { name: "Doktor ciro sıralaması" });
const satirlar = (page: Page) => siralama(page).locator("tbody tr:has(a[href^='/doctors/'])");

test("satıcı adı doktor listesini o satıcıyla süzer; sıra dönem sırasıdır (X-1-2)", async ({ page }) => {
  await page.goto("/reports?donem=tum");
  // Sayfa akışla gelir (iskelet önce): satır görünmeden sayılmaz.
  await expect(satirlar(page).first()).toBeVisible();
  const saticiTablosu = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Hakediş (KDV hariç)" }) });
  await saticiTablosu.getByRole("link", { name: SEED_SELLER_NAME }).click();
  await expect(page).toHaveURL(/\/reports\?donem=tum&satici=/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText(`Satıcı: ${SEED_SELLER_NAME}`)).toBeVisible();
  await expect(satirlar(page).first()).toBeVisible();
  const n = await satirlar(page).count();
  for (let i = 0; i < n; i++) await expect(satirlar(page).nth(i).locator("td").nth(2)).toHaveText(SEED_SELLER_NAME);
  // Sıra numaraları artan ve dönem sırasından (süzülmüş listede 1'den yeniden başlamaz olabilir).
  const siralar = (await satirlar(page).locator("td:first-child").allInnerTexts()).map((t) => parseInt(t, 10));
  expect([...siralar].sort((a, b) => a - b)).toEqual(siralar);
});

test("dönem değişince ve tüm zamanlara geçince süzgeç korunur", async ({ page }) => {
  await page.goto("/reports?satici=sahipsiz&q=dr");
  await expect(page.getByRole("link", { name: "Tüm zamanlar" })).toHaveAttribute("href", /satici=sahipsiz&q=dr/);
  await page.locator("#donem").fill("2026-03");
  await page.getByRole("button", { name: "Göster" }).click();
  await expect(page).toHaveURL(/donem=2026-03/);
  await expect(page).toHaveURL(/satici=sahipsiz/);
  await expect(page).toHaveURL(/q=dr/);
});

test("bilinmeyen satıcı adresten düşer; sayfa dışı son sayfaya", async ({ page }) => {
  await page.goto("/reports?donem=tum&satici=cm0000000000000000000000x");
  await expect(page).toHaveURL(/\/reports\?donem=tum$/);
  await page.goto("/reports?donem=tum&page=999");
  await expect(page).not.toHaveURL(/page=999/);
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "rapor-sutunlar" });
  });

  test("Lidere göre sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => siralama(page).getByRole("columnheader", { name: "Lidere göre" });
    await page.goto("/reports?donem=tum");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Lidere göre").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});
