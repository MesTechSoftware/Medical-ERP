import { test, expect, type Locator, type Page } from "@playwright/test";
import { USERS, kpiIskeletiEslesir, kpiKartlariTasmaz, sorgu, yumusakGezinmeIsareti } from "../helpers";

/** Ü-32 — Doktorlarım: kapsam (X-13-4), KPI (kart = satır), süzgeç, sütun seçici, yan panel, yeniden yüklemesiz gezinme. */

const kpi = (page: Page) => page.getByRole("region", { name: "Doktor sayıları" });
const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
const satirlar = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");
const sayi = async (l: Locator) => Number((await l.innerText()).match(/\d+/)![0]);

async function saticiKimligi(): Promise<string> {
  const [u] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [USERS.seller.email]);
  return u.id;
}

async function satirKimlikleri(page: Page): Promise<string[]> {
  await expect(satirlar(page).first()).toBeVisible();
  return satirlar(page).locator("a[data-kayit]").evaluateAll((a) => a.map((e) => e.getAttribute("data-kayit")!));
}

test("4 kart; liste yalnız kendi DOKTOR carileri; 'Hiç siparişi yok' kartı satır sayısına eşit", async ({ page }) => {
  const id = await saticiKimligi();
  await page.goto("/my-doctors?per=100");
  await expect(kpi(page).getByRole("link")).toHaveCount(4);
  const kimlikler = await satirKimlikleri(page);
  const [{ yabanci }] = await sorgu<{ yabanci: number }>(
    `SELECT count(*)::int AS yabanci FROM "Doctor" WHERE id = ANY($1) AND ("ownerSellerId" IS DISTINCT FROM $2 OR "accountClass" <> 'DOKTOR')`,
    [kimlikler, id]
  );
  expect(yabanci, "listede başkasının ya da bayi carisi").toBe(0);
  const toplam = await sayi(kpi(page).getByRole("link", { name: /^Doktorlarım/ }));
  const [{ n }] = await sorgu<{ n: number }>(
    `SELECT count(*)::int AS n FROM "Doctor" WHERE "ownerSellerId" = $1 AND "accountClass" = 'DOKTOR'`,
    [id]
  );
  expect(toplam).toBe(n);

  const kart = kpi(page).getByRole("link", { name: /^Hiç siparişi yok/ });
  const deger = await sayi(kart);
  await kart.click();
  await expect(page).toHaveURL(/\/my-doctors\?sessiz=hic$/);
  await expect(etkinler(page).getByText("Son sipariş: hiç yok")).toBeVisible();
  await page.goto("/my-doctors?sessiz=hic&per=100");
  await expect(satirlar(page)).toHaveCount(Math.min(deger, 100));
});

test("Filtrele'de sınıf, satıcı ve fatura alanı yok; adresteki satıcı süzgeci düşer; başka satıcının carisi panelde açılmaz", async ({ page }) => {
  const id = await saticiKimligi();
  const [baska] = await sorgu<{ id: string; ownerSellerId: string }>(
    `SELECT id, "ownerSellerId" FROM "Doctor" WHERE "ownerSellerId" IS NOT NULL AND "ownerSellerId" <> $1 LIMIT 1`,
    [id]
  );
  expect(baska, "demo verisinde başka satıcının carisi olmalı").toBeDefined();
  await page.goto("/my-doctors");
  await page.getByText("Filtrele", { exact: true }).click();
  const form = page.getByRole("form", { name: "Doktor süzgeci" });
  await expect(form.getByLabel("Bölge")).toBeVisible();
  await expect(form.getByLabel("Sorumlu satıcı")).toHaveCount(0);
  await expect(form.getByLabel("Hesap sınıfı")).toHaveCount(0);
  await expect(form.getByLabel("Eksik fatura bilgisi")).toHaveCount(0);

  await page.goto(`/my-doctors?satici=${baska.ownerSellerId}&sinif=BAYI`);
  await expect(page).toHaveURL(/\/my-doctors$/);
  await expect(etkinler(page)).toHaveCount(0);

  await page.goto(`/my-doctors?detay=${baska.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Doktorlarım" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("yan panel istemci tarafında açılır ve kapanır: sayfa yeniden yüklenmez, KPI yerinde kalır; cari özeti görünür", async ({ page }) => {
  await page.goto("/my-doctors");
  const yumusak = await yumusakGezinmeIsareti(page);
  await kpi(page).evaluate((el) => ((el as HTMLElement & { __isaret?: number }).__isaret = 1));
  const isaretYerinde = () => kpi(page).evaluate((el) => (el as HTMLElement & { __isaret?: number }).__isaret === 1);

  const ilk = satirlar(page).first().locator("a[data-kayit]");
  await ilk.click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("region", { name: "Cari özeti" })).toContainText("Bakiye");
  await expect(panel.getByRole("region", { name: "Kimlik ve iletişim" })).not.toContainText("Sorumlu satıcı");
  await expect(panel.getByRole("region", { name: "Devir geçmişi" })).toHaveCount(0);
  expect(await yumusak()).toBe(true);
  expect(await isaretYerinde()).toBe(true);

  await panel.getByRole("link", { name: "Kapat" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(ilk).toBeFocused();
  expect(await yumusak()).toBe(true);
  expect(await isaretYerinde()).toBe(true);
});

test("paneldeki son sipariş Siparişlerim panelini açar; Siparişlerim panelindeki cari adı geri döner", async ({ page }) => {
  const id = await saticiKimligi();
  const [o] = await sorgu<{ id: string; documentNo: string; doctorId: string }>(
    `SELECT o.id, o."documentNo", o."doctorId" FROM "Order" o JOIN "Doctor" d ON d.id = o."doctorId"
     WHERE o."sellerId" = $1 AND d."ownerSellerId" = $1 ORDER BY o."orderDate" DESC, o.id DESC LIMIT 1`,
    [id]
  );
  expect(o, "satıcının kendi carisine siparişi olmalı").toBeDefined();
  await page.goto(`/my-doctors?detay=${o.doctorId}`);
  await page.getByRole("dialog").getByRole("region", { name: "Son siparişlerim" }).getByRole("link", { name: o.documentNo }).click();
  await expect(page).toHaveURL(new RegExp(`/my-orders\\?detay=${o.id}$`));
  const siparisPaneli = page.getByRole("dialog");
  await expect(siparisPaneli.getByRole("heading", { name: o.documentNo })).toBeVisible();
  await siparisPaneli.getByRole("region", { name: "Özet" }).getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`/my-doctors\\?detay=${o.doctorId}$`));
  await expect(page.getByRole("dialog").getByRole("region", { name: "Cari özeti" })).toBeVisible();
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "doktorlarim-sutunlar" });
  });

  test("Sorumlu satıcı sütunu yok; Bakiye gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: /^Bakiye/ });
    await page.goto("/my-doctors");
    await expect(page.getByRole("columnheader", { name: "Sorumlu Satıcı" })).toHaveCount(0);
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await expect(menu.getByLabel("Sorumlu Satıcı")).toHaveCount(0);
    await menu.getByLabel("Bakiye").uncheck();
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
  await page.goto("/my-doctors");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/my-doctors");
});
