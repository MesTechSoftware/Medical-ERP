import { test, expect, type Page } from "@playwright/test";
import { sorgu } from "../helpers";

/** Ü-20 — stok ekranı: KPI kartları, hareket süzgeci, işlemi yapan, sütun seçici, boş durum (B-4-8 · B-4-10). */

const kpi = (page: Page) => page.getByRole("region", { name: "Stok sayıları" });
const tablo = (page: Page) => page.getByRole("table");
/** Veri satırları (başlık ve boş durum hariç). */
const satirlar = (page: Page) => page.locator("tbody tr[data-hareket]");

async function stokGirisi(page: Page, not: string) {
  await page.goto("/stock");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Stok Girişi Ekle" }) });
  await form.getByLabel("Ürün").selectOption({ index: 1 });
  await form.getByLabel("Miktar (adet)").fill("2");
  await form.getByLabel("Açıklama (opsiyonel)").fill(not);
  await form.getByRole("button", { name: "Stok Girişi Ekle" }).click();
  await expect(page.getByText("Stok girişi kaydedildi.")).toBeVisible();
}

const bugun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(Date.now());

test("Bugün giriş kartı süzgeci uygular; satır sayısı = kart (B-4-10)", async ({ page }) => {
  await stokGirisi(page, `E2E kart ${Date.now()}`);
  await page.goto("/stock?per=100");
  const kart = kpi(page).getByRole("link", { name: /Bugün giriş/ });
  const deger = Number((await kart.innerText()).match(/\d+/)![0]);
  await kart.click();
  await expect(page).toHaveURL((u) => {
    const p = u.searchParams;
    return p.get("baslangic") === bugun() && p.get("bitis") === bugun() && p.get("yon") === "GIRIS";
  });
  const etiketler = page.getByRole("list", { name: "Etkin süzgeçler" });
  await expect(etiketler.getByText("Yön: Giriş")).toBeVisible();
  await expect(etiketler.getByText(/^Tarih: /)).toBeVisible();
  const [{ adet }] = await sorgu<{ adet: number }>(
    `SELECT count(*)::int AS adet FROM "StockMovement" WHERE type = 'GIRIS'
       AND ("createdAt" AT TIME ZONE 'Europe/Istanbul')::date = (now() AT TIME ZONE 'Europe/Istanbul')::date`
  );
  expect(deger).toBe(adet);
  // Kart sayısı ile satır sayısı aynıdır (spec §3.2); sayfa boyu bütün satırları alır.
  await page.goto(`/stock?baslangic=${bugun()}&bitis=${bugun()}&yon=GIRIS&per=100`);
  await expect(satirlar(page)).toHaveCount(deger);
});

test("yeni girişte işlemi yapan kullanıcı adı görünür (B-4-8)", async ({ page }) => {
  const not = `E2E yapan ${Date.now()}`;
  await stokGirisi(page, not);
  const satir = satirlar(page).filter({ hasText: not });
  await expect(satir).toHaveCount(1);
  await expect(satir).toContainText("Sistem Yöneticisi");
  await expect(satir).toContainText("+2");
});

test("Filtrele formu tür süzgeci uygular; × ile kalkar", async ({ page }) => {
  await page.goto("/stock");
  await page.getByText("Filtrele", { exact: true }).click();
  const form = page.getByRole("form", { name: "Hareket süzgeci" });
  await form.getByLabel("Tür").selectOption({ label: "Stok girişi" });
  await form.getByRole("button", { name: "Uygula" }).click();
  await expect(page).toHaveURL(/tur=giris/);
  await expect(page.getByRole("list", { name: "Etkin süzgeçler" }).getByText("Tür: Stok girişi")).toBeVisible();
  await expect(satirlar(page).first()).toBeVisible();
  const turler = await satirlar(page).locator("td[data-sutun='tur']").allInnerTexts();
  expect(turler.length).toBeGreaterThan(0);
  for (const t of turler) expect(t).toContain("Stok girişi");
  await page.getByRole("link", { name: "Kaldır: Tür: Stok girişi" }).click();
  await expect(page).not.toHaveURL(/tur=/);
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "stok-sutunlar" });
  });

  test("sütun gizlenir ve kalıcıdır", async ({ page }) => {
    const baslik = () => tablo(page).getByRole("columnheader", { name: "İşlemi yapan" });
    const menu = async () => {
      await page.getByText("Sütunlar", { exact: true }).click();
      return page.getByRole("form", { name: "Görünür sütunlar" });
    };
    await page.goto("/stock");
    await expect(baslik()).toBeVisible();
    const m = await menu();
    await m.getByLabel("İşlemi yapan").uncheck();
    await m.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await (await menu()).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("süzgece uyan hareket yoksa boş durum ve temizleme", async ({ page }) => {
  await page.goto("/stock?baslangic=2000-01-01&bitis=2000-01-01");
  await expect(page.getByText("Bu süzgeçlere uyan hareket bulunamadı.")).toBeVisible();
  await page.getByRole("link", { name: "Süzgeçleri temizle" }).click();
  await expect(page).toHaveURL(/\/stock$/);
});

test("sayfa dışı adres son sayfaya gider; süzgeç ve sayfa boyu korunur", async ({ page }) => {
  const [{ adet }] = await sorgu<{ adet: number }>(`SELECT count(*)::int AS adet FROM "StockMovement" WHERE type = 'GIRIS'`);
  await page.goto("/stock?yon=GIRIS&per=1&page=999");
  await expect(page).toHaveURL((u) => {
    const p = u.searchParams;
    return u.pathname === "/stock" && p.get("yon") === "GIRIS" && p.get("per") === "1" && p.get("page") === String(adet);
  });
  await expect(satirlar(page)).toHaveCount(1);
});
