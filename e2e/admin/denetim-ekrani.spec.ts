import { test, expect, type Page } from "@playwright/test";
import { kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu } from "../helpers";

/** Ü-28 — denetim kaydı ekranı: KPI (X-18-8), tarih sekmeleri, açılır süzgeç, etkin etiketler, sütun seçici. */

const kpi = (page: Page) => page.getByRole("region", { name: "Denetim sayıları" });
const satirlar = (page: Page) => page.getByRole("table", { name: "Denetim kayıtları" }).locator("tbody tr:has(a[data-kayit])");

test("başarısız giriş kartı süzgeci açar; kart = satır (X-18-8)", async ({ browser, page }) => {
  // Bugün en az bir başarısız giriş olsun.
  const misafir = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const giris = await misafir.newPage();
  await giris.goto("/login");
  await giris.getByLabel("E-posta").fill("yok@medikal.local");
  await giris.getByLabel("Şifre").fill("yanlis-sifre");
  await giris.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(giris.getByRole("alert")).toBeVisible();
  await misafir.close();

  await page.goto("/audit-logs");
  const kart = kpi(page).getByRole("link", { name: /Bugün başarısız giriş/ });
  const deger = parseInt((await kart.innerText()).split("\n").map((t) => t.trim()).find((t) => /^\d+$/.test(t)) ?? "", 10);
  expect(deger).toBeGreaterThan(0);
  await kart.click();
  await expect(page).toHaveURL(/olay=AUTH_LOGIN_FAILURE/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText("Olay: Giriş başarısız")).toBeVisible();
  // Kart = bugünün (İstanbul) başarısız girişleri; liste eşitliği itest'te (sayfa boyu 50).
  const [{ n }] = await sorgu<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM "AuditLog" WHERE action = 'AUTH_LOGIN_FAILURE'
       AND ("createdAt" AT TIME ZONE 'Europe/Istanbul')::date = (now() AT TIME ZONE 'Europe/Istanbul')::date`
  );
  expect(deger).toBe(parseInt(n, 10));
  await expect(satirlar(page)).toHaveCount(Math.min(deger, 50));
});

test("tarih sekmesi ve etiket kaldırma süzgeci günceller", async ({ page }) => {
  await page.goto("/audit-logs?modul=KULLANICI");
  await page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: "Bugün" }).click();
  await expect(page).toHaveURL(/baslangic=\d{4}-\d{2}-\d{2}&bitis=\d{4}-\d{2}-\d{2}&modul=KULLANICI/);
  const etiketler = page.getByRole("list", { name: "Etkin süzgeçler" });
  await expect(etiketler.getByText("Modül: Kullanıcı ve oturum")).toBeVisible();
  await etiketler.getByRole("link", { name: "Kaldır: Modül: Kullanıcı ve oturum" }).click();
  await expect(page).not.toHaveURL(/modul=/);
});

test("imleçle gelinen boş sayfa ilk sayfaya dönüş verir", async ({ page }) => {
  await page.goto("/audit-logs?once=1");
  await expect(page.getByText("Bu sayfada kayıt yok.")).toBeVisible();
  await page.getByRole("link", { name: "Süzgeçleri temizle" }).click();
  await expect(page).toHaveURL(/\/audit-logs$/);
  await expect(satirlar(page).first()).toBeVisible();
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "denetim-sutunlar" });
  });

  test("Özet sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: "Özet" });
    await page.goto("/audit-logs");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Özet").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("KPI kartları taşmaz; iskelet gerçek yerleşimle eşleşir", async ({ page }) => {
  await page.goto("/audit-logs");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/audit-logs");
});
