import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { sorgu, stoksuzSiparis } from "../helpers";

/**
 * D-2-1 — OPERASYON ekran matrisi (D-2 §(1) ve 17.10 eki). Oturum `auth.setup.ts`'te
 * açılır ve Dashboard'a düştüğü orada doğrulanır. Yetki sunucudadır: yalnız YONETICI'nin
 * sayfaları OPERASYON'u ana sayfasına yönlendirir; menüden gizlemek yetki değildir.
 */

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

test("menü raporları ve denetim kaydını göstermez; rol etiketi Operasyon", async ({ page }) => {
  await page.goto("/dashboard");
  const menu = page.locator("aside");
  await expect(menu.getByRole("link", { name: "Siparişler" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Kullanıcılar" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Raporlar" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Denetim Kaydı" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Dışa Aktarım" })).toHaveCount(0); // D-5 §(4)
  await expect(page.locator("header").getByText("Operasyon", { exact: true })).toBeVisible();
});

test("dashboard KPI'ları görünür (bu ay ciro ve tahsilat); prim ve hakediş yok (D-2 §(1))", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("group", { name: "Ciro", exact: true })).toContainText("KDV hariç");
  await expect(page.getByRole("group", { name: "Tahsilat", exact: true })).toContainText("KDV dahil");
  await expect(page.getByRole("group", { name: "Bekleyen sipariş" })).toBeVisible();
  await expect(page.getByRole("main").getByText(/hakediş|prim/i)).toHaveCount(0);
});

test("dashboard: sayfa şeridi yalnız OPERASYON'un sayfaları (7); aktivite akışı ve onay istisnası yok (D-2)", async ({ page }) => {
  await page.goto("/dashboard");
  const kutular = page.locator("[data-sayfa-seridi] a");
  await expect(kutular).toHaveCount(7);
  expect(await kutular.evaluateAll((a) => a.map((e) => e.getAttribute("href")))).toEqual([
    "/orders",
    "/shipping",
    "/stock",
    "/products",
    "/doctors",
    "/collections",
    "/users",
  ]);
  await expect(page.getByRole("region", { name: "Son hareketler" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Onaylara git" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Kritik stok" })).toBeVisible();
});

for (const yol of ["/reports", "/audit-logs", "/exports", "/approvals", "/price-lists", "/doctors/new", "/imports", "/products/new", "/users/new"]) {
  test(`${yol} OPERASYON'u Dashboard'a yönlendirir`, async ({ page }) => {
    await page.goto(yol);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
}

test("ürünleri ve satıcıları salt okur — ekleme/düzenleme/silme yok", async ({ page }) => {
  // Liste sayfalıdır (Ü-19); seed ürünü e2e'nin eklediklerinin altında kalabilir.
  await page.goto("/products?per=100");
  await expect(page.getByRole("heading", { name: "Ürünler" })).toBeVisible();
  await expect(page.getByText("Cerrahi Eldiven (Kutu)")).toBeVisible();
  await expect(page.getByRole("link", { name: "Yeni Ürün" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Düzenle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sil" })).toHaveCount(0);

  // Kullanıcılar ekranında yalnız satıcıları görür (E-2-5).
  await page.goto("/users");
  await expect(page.getByText("Ahmet Yılmaz")).toBeVisible();
  await expect(page.getByText("admin@medikal.local")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Yeni Kullanıcı" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Düzenle" })).toHaveCount(0);

  const [satici] = await query<{ id: string }>(`SELECT id FROM "User" WHERE email = 'ahmet@medikal.local'`);
  await page.goto(`/users/${satici.id}`);
  await expect(page.getByRole("heading", { name: "Ahmet Yılmaz" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Düzenle" })).toHaveCount(0);
  await page.goto(`/users/${satici.id}/edit`);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("bütün carileri görür; devir formu yoktur (X-13 §(1)/(5))", async ({ page }) => {
  await page.goto("/doctors");
  const [{ adet }] = await query<{ adet: string }>(`SELECT count(*)::text AS adet FROM "Doctor"`);
  await expect(page.locator("tbody tr")).toHaveCount(Math.min(parseInt(adet, 10), 25)); // sayfa başı 25 (pagination.ts)
  await expect(page.getByRole("button", { name: "Devret" })).toHaveCount(0);
  await expect(page.locator('input[name="doctorId"]')).toHaveCount(0);
});

test("cari listesinde yan paneli açar; Düzenle ve Yeni Cari yoktur (X-13-2)", async ({ page }) => {
  const [d] = await query<{ id: string; fullName: string }>(`SELECT id, "fullName" FROM "Doctor" ORDER BY "fullName" LIMIT 1`);
  await page.goto(`/doctors?detay=${d.id}`);
  const panel = page.getByRole("dialog", { name: new RegExp(d.fullName) });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: "Tam detaya git" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Düzenle" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Yeni Cari" })).toHaveCount(0);
});

test("OPERASYON ürün panelini görür; Yeni Ürün, Düzenle, Sil yok (D-2-2)", async ({ page }) => {
  const [u] = await query<{ id: string; name: string }>(`SELECT id, name FROM "Product" WHERE status = 'AKTIF' ORDER BY name LIMIT 1`);
  await page.goto(`/products?detay=${u.id}`);
  const panel = page.getByRole("dialog", { name: u.name });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("region", { name: "Fiyat listeleri" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Stok girişi" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Düzenle" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Yeni Ürün" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sil" })).toHaveCount(0);
});

test("OPERASYON stok KPI ve hareket tablosunu görür; Stok Düzeltme yok", async ({ page }) => {
  await page.goto("/stock");
  await expect(page.getByRole("region", { name: "Stok sayıları" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "İşlemi yapan" })).toBeVisible();
  await expect(page.locator("tbody tr[data-hareket]").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stok Düzeltme" })).toHaveCount(0);
});

test("stok girişi yapar (stok hareketi — D-2 §(1))", async ({ page }) => {
  const not = `E2E operasyon girişi ${Date.now()}`;
  await page.goto("/stock");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Stok Girişi Ekle" }) });
  await form.getByLabel("Ürün").selectOption({ index: 1 });
  await form.getByLabel("Miktar (adet)").fill("3");
  await form.getByLabel("Açıklama (opsiyonel)").fill(not);
  await form.getByRole("button", { name: "Stok Girişi Ekle" }).click();
  await expect(page.getByText("Stok girişi kaydedildi.")).toBeVisible();
  // B-7 · D-2 §(2): stok düzeltme yalnız yöneticinin.
  await expect(page.getByRole("heading", { name: "Stok Düzeltme" })).toHaveCount(0);
  const hareket = await query(`SELECT id FROM "StockMovement" WHERE note = $1 AND type = 'GIRIS' AND quantity = 3`, [not]);
  expect(hareket).toHaveLength(1);
});

test("stoksuz sevkiyatta gerekçe siparişi onaya gönderir; sevkiyat yazılmaz (A-8-9)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await page.goto("/shipping");
  const kart = page.locator("[data-sevk-karti]").filter({ hasText: s.doktorAdi });
  await kart.getByRole("button", { name: "Kargola" }).click();
  const diyalog = kart.getByRole("dialog");
  await expect(diyalog).toContainText("işlem sonrası stok -2 adet olur.");
  await diyalog.getByLabel("Gerekçe").fill("Acil vaka");
  await diyalog.getByRole("button", { name: "Gerekçeyle devam et" }).click();

  await expect(kart.getByRole("status")).toContainText("Onaya gönderildi");
  expect(await sorgu(`SELECT 1 FROM "Shipment" WHERE "orderId" = $1`, [s.siparisId])).toHaveLength(0);
  const [blok] = await sorgu<{ decision: string | null }>(`SELECT decision FROM "ApprovalBlock" WHERE "documentId" = $1`, [
    s.siparisId,
  ]);
  expect(blok.decision).toBeNull();

  await page.reload();
  await expect(page.locator("[data-sevk-karti]").filter({ hasText: s.doktorAdi }).getByText("Onay bekliyor")).toBeVisible();
});

test("bayiye sipariş girer; sipariş satıcısız açılır (X-8-3, D-2 §(1))", async ({ page }) => {
  const ek = `${Date.now()}`.slice(-7);
  const ad = `E2E Bayi Sip ${ek}`;
  await sorgu(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", "phoneNormalized", "partyType", status)
     VALUES ($1, 'BAYI', $2, $3, 'TUZEL_KISI', 'AKTIF')`,
    [`e2e-bayi-${ek}`, ad, `+90537${ek}`]
  );
  await page.goto("/orders/new");
  await page.getByLabel("Doktor").selectOption({ label: `[Bayi] ${ad}` });
  await page.getByLabel("Ürün").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();
  await expect(page).toHaveURL(/\/orders\/(?!new$)[^/]+$/);
  const [o] = await sorgu<{ sellerId: string | null }>(`SELECT "sellerId" FROM "Order" WHERE "doctorId" = $1`, [`e2e-bayi-${ek}`]);
  expect(o.sellerId).toBeNull();
});
