import { test, expect, type Locator, type Page } from "@playwright/test";
import { USERS, kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu, yumusakGezinmeIsareti } from "../helpers";

/** Ü-31 — Siparişlerim: kapsam (X-13-3), KPI (A-5-8 satıcı kapsamıyla), süzgeç, sütun seçici, yan panel, yeniden yüklemesiz gezinme. */

const kpi = (page: Page) => page.getByRole("region", { name: "Sipariş sayıları" });
const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
const satirlar = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");
const sayi = async (l: Locator) => Number((await l.innerText()).match(/\d+/)![0]);

async function saticiKimligi(): Promise<string> {
  const [u] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [USERS.seller.email]);
  return u.id;
}

test("4 kart; Bekliyor kartı aralığıyla süzgeci açar ve satır sayısına eşit; liste yalnız kendi siparişleri", async ({ page }) => {
  const id = await saticiKimligi();
  const [{ n }] = await sorgu<{ n: number }>(`SELECT count(*)::int AS n FROM "Order" WHERE "sellerId" = $1`, [id]);
  await page.goto("/my-orders?per=100");
  await expect(kpi(page).getByRole("group")).toHaveCount(4);
  await expect(kpi(page).getByRole("link")).toHaveCount(3);
  await expect(satirlar(page)).toHaveCount(Math.min(n, 100));

  const kart = kpi(page).getByRole("link", { name: /^Bekliyor/ });
  const deger = await sayi(kart);
  await kart.click();
  await expect(page).toHaveURL(/\/my-orders\?durum=BEKLIYOR&baslangic=\d{4}-\d{2}-01&bitis=\d{4}-\d{2}-\d{2}/);
  await expect(etkinler(page).getByText("Durum: Bekliyor")).toBeVisible();
  await page.goto(`${page.url()}&per=100`);
  await expect(satirlar(page)).toHaveCount(Math.min(deger, 100));
});

test("Filtrele'de satıcı alanı yok; adresteki satıcı süzgeci kapsamı değiştirmez; başka satıcının siparişi panelde açılmaz", async ({ page }) => {
  const id = await saticiKimligi();
  const [baska] = await sorgu<{ id: string; sellerId: string }>(
    `SELECT id, "sellerId" FROM "Order" WHERE "sellerId" IS NOT NULL AND "sellerId" <> $1 LIMIT 1`,
    [id]
  );
  expect(baska, "demo verisinde başka satıcının siparişi olmalı").toBeDefined();
  await page.goto("/my-orders");
  await page.getByText("Filtrele", { exact: true }).click();
  const form = page.getByRole("form", { name: "Sipariş süzgeci" });
  await expect(form.getByLabel("Ara")).toBeVisible();
  await expect(form.getByLabel("Satıcı")).toHaveCount(0);

  // Adresteki satıcı adresten düşer; görünen her satır bu satıcının (sayı değil kimlik denetlenir).
  await page.goto(`/my-orders?satici=${baska.sellerId}&per=100`);
  await expect(page).toHaveURL(/\/my-orders\?per=100$/);
  await expect(etkinler(page)).toHaveCount(0);
  const kimlikler = await satirlar(page).locator("a[data-kayit]").evaluateAll((a) => a.map((e) => e.getAttribute("data-kayit")!));
  expect(kimlikler.length).toBeGreaterThan(0);
  const [{ yabanci }] = await sorgu<{ yabanci: number }>(
    `SELECT count(*)::int AS yabanci FROM "Order" WHERE id = ANY($1) AND "sellerId" IS DISTINCT FROM $2`,
    [kimlikler, id]
  );
  expect(yabanci, "listede başka satıcının siparişi").toBe(0);

  await page.goto(`/my-orders?detay=${baska.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Siparişlerim" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("yan panel istemci tarafında açılır ve kapanır: sayfa yeniden yüklenmez, KPI ve tablo yerinde kalır", async ({ page }) => {
  await page.goto("/my-orders");
  const yumusak = await yumusakGezinmeIsareti(page);
  // İşaret DOM düğümünde durur: düğüm yeniden kurulursa (iskelet, tam yükleme) kaybolur.
  await kpi(page).evaluate((el) => ((el as HTMLElement & { __isaret?: number }).__isaret = 1));
  const isaretYerinde = () => kpi(page).evaluate((el) => (el as HTMLElement & { __isaret?: number }).__isaret === 1);

  const ilk = satirlar(page).first().locator("a[data-kayit]");
  await ilk.click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("region", { name: "Kalemler" })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Özet" })).not.toContainText("Satıcı");
  expect(await yumusak()).toBe(true);
  expect(await isaretYerinde()).toBe(true);

  await panel.getByRole("link", { name: "Kapat" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(ilk).toBeFocused();
  expect(await yumusak()).toBe(true);
  expect(await isaretYerinde()).toBe(true);
});

test("panelin Tam detay bağlantısı satıcının detay sayfasına gider", async ({ page }) => {
  await page.goto("/my-orders");
  const ilk = satirlar(page).first().locator("a[data-kayit]");
  const kimlik = await ilk.getAttribute("data-kayit");
  await ilk.click();
  await page.getByRole("dialog").getByRole("link", { name: "Tam detay" }).click();
  await expect(page).toHaveURL(new RegExp(`/my-orders/${kimlik}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Sipariş Detayı" })).toBeVisible();
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "siparislerim-sutunlar" });
  });

  test("Satıcı sütunu yok; Belge no gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: "Belge no" });
    await page.goto("/my-orders");
    await expect(page.getByRole("columnheader", { name: "Satıcı" })).toHaveCount(0);
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await expect(menu.getByLabel("Satıcı")).toHaveCount(0);
    await menu.getByLabel("Belge no").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("kartlar taşmaz; iskelet gerçek kartlarla eşleşir", async ({ page }) => {
  await page.goto("/my-orders");
  await expect(page.getByRole("group", { name: "Toplam sipariş", exact: true })).toContainText("Bu ay · teklif hariç");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/my-orders");
});
