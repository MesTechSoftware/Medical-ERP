import { test, expect } from "@playwright/test";

/**
 * Dashboard (brief "Tasarım 2. Tur Eki", ADR-010) — yönetici, 1280 px: istisna bandı, zaman
 * filtresi, hızlı işlem, aktivite akışı ve tazelemesi, sayfa şeridi.
 */

const SERIT = [
  "/orders",
  "/shipping",
  "/approvals",
  "/stock",
  "/products",
  "/doctors",
  "/collections",
  "/price-lists",
  "/users",
  "/reports",
  "/audit-logs",
  "/imports",
  "/exports",
];

test("istisna bandı sabit bölge: en çok 3 madde, her biri eylem bağlantılı; bütün istisnalar Dikkat listesinde", async ({ page }) => {
  await page.goto("/dashboard");
  const bant = page.getByRole("region", { name: "Dikkat gerektirenler" });
  await expect(bant).toBeVisible(); // demo verisinde kritik stok var
  const maddeler = bant.getByRole("listitem");
  const adet = await maddeler.count();
  expect(adet).toBeGreaterThan(0);
  expect(adet).toBeLessThanOrEqual(4); // 3 madde + "+N uyarı daha"
  for (let i = 0; i < Math.min(adet, 3); i++) await expect(maddeler.nth(i).getByRole("link")).toHaveCount(1);
  await expect(bant.locator("[aria-live]")).toHaveCount(0);
  await expect(page.locator("#dikkat")).toContainText(/ürün (kritik stokta|tükendi)/);
});

test("zaman filtresi URL'de: dönem KPI'ları değişir, anlık KPI değişmez; geri tuşu önceki aralığa döner", async ({ page }) => {
  await page.goto("/dashboard");
  const filtre = page.getByRole("navigation", { name: "Zaman aralığı" });
  const ciro = page.getByRole("group", { name: "Ciro", exact: true });
  const bekleyen = page.getByRole("group", { name: "Bekleyen sipariş" });
  await expect(filtre.getByRole("link", { name: "Bu Ay" })).toHaveAttribute("aria-current", "page");
  await expect(ciro).toContainText("Bu ay");
  const bekleyenDegeri = await bekleyen.locator("div").nth(1).innerText();

  await filtre.getByRole("link", { name: "Bu Yıl" }).click();
  await expect(page).toHaveURL(/\/dashboard\?aralik=yil$/);
  await expect(filtre.getByRole("link", { name: "Bu Yıl" })).toHaveAttribute("aria-current", "page");
  await expect(ciro).toContainText("Bu yıl");
  await expect(bekleyen).toContainText("şu an");
  expect(await bekleyen.locator("div").nth(1).innerText(), "anlık KPI filtreden etkilenmez").toBe(bekleyenDegeri);
  await expect(bekleyen).toContainText("Medyan hazırlama (bu yıl)");

  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(ciro).toContainText("Bu ay");
});

test("kritik stok hızlı işlemi: stok girişi ekranı ürün önseçili açılır", async ({ page }) => {
  await page.goto("/dashboard");
  // Bandın "Stok girişi" eylemi stok ekranına gider; hızlı işlem ürünü önseçer (`?urun=`).
  const baglanti = page.locator('main a[href^="/stock?urun="]').first();
  const urun = new URL((await baglanti.getAttribute("href"))!, "http://x").searchParams.get("urun")!;
  await baglanti.click();
  await expect(page).toHaveURL(new RegExp(`/stock\\?urun=${urun}$`));
  await expect(page.locator("#productId")).toHaveValue(urun);
});

test("aktivite akışı insan diliyle: ham alan, JSON ve kimlik yok; tam tarih title'da; 'Tümünü gör' denetim kaydına", async ({ page }) => {
  await page.goto("/dashboard");
  const akis = page.getByRole("region", { name: "Son hareketler" });
  await expect(akis.getByRole("listitem").first()).toBeVisible();
  expect(await akis.innerText()).not.toMatch(/[{}]|\bc[a-z0-9]{24}\b/);
  await expect(akis.locator("time").first()).toHaveAttribute("title", /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
  await expect(akis.getByRole("link", { name: "Tümünü gör" })).toHaveAttribute("href", "/audit-logs");
});

test("akış tazelemesi (K-D3): sekme görünürken 60 sn'de bir yeniden çizilir; gizliyken durur", async ({ page }) => {
  await page.clock.install();
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Son hareketler" })).toBeVisible();
  const yenileme = (r: import("@playwright/test").Request) => new URL(r.url()).pathname === "/dashboard" && r.headers()["rsc"] === "1";

  const istek = page.waitForRequest(yenileme);
  await page.clock.runFor(61_000);
  await istek;

  let gizliyken = 0;
  page.on("request", (r) => {
    if (yenileme(r)) gizliyken += 1;
  });
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(130_000);
  expect(gizliyken, "gizli sekmede tazeleme yok").toBe(0);
});

test("sayfa şeridi: 13 sayfa sırasıyla, kutu kendi sayfasına; ikon, ad ve tek sayı", async ({ page }) => {
  await page.goto("/dashboard");
  const kutular = page.locator("[data-sayfa-seridi] a");
  await expect(kutular).toHaveCount(SERIT.length);
  expect(await kutular.evaluateAll((a) => a.map((e) => e.getAttribute("href")))).toEqual(SERIT);
  await expect(kutular.first()).toContainText(/Siparişler\s*\d+ bekliyor/);
  await expect(kutular.first().locator('svg[aria-hidden="true"]')).toHaveCount(1);
  await page.locator('[data-sayfa-seridi] a[href="/stock"]').click();
  await expect(page.getByRole("heading", { level: 1, name: "Stok" })).toBeVisible();
});
