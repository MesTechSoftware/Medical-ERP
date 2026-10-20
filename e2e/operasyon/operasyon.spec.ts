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
  await expect(menu.getByRole("link", { name: "Audit Log" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Dışa Aktarım" })).toHaveCount(0); // D-5 §(4)
  await expect(page.locator("header").getByText("Operasyon", { exact: true })).toBeVisible();
});

for (const yol of ["/reports", "/audit-logs", "/exports", "/approvals", "/products/new", "/users/new"]) {
  test(`${yol} OPERASYON'u Dashboard'a yönlendirir`, async ({ page }) => {
    await page.goto(yol);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
}

test("ürünleri ve satıcıları salt okur — ekleme/düzenleme/silme yok", async ({ page }) => {
  await page.goto("/products");
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

test("stok girişi yapar (stok hareketi — D-2 §(1))", async ({ page }) => {
  const not = `E2E operasyon girişi ${Date.now()}`;
  await page.goto("/stock");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Stok Girişi Ekle" }) });
  await form.getByLabel("Ürün").selectOption({ index: 1 });
  await form.getByLabel("Miktar (adet)").fill("3");
  await form.getByLabel("Açıklama (opsiyonel)").fill(not);
  await form.getByRole("button", { name: "Stok Girişi Ekle" }).click();
  await expect(page.getByText("Stok girişi kaydedildi.")).toBeVisible();
  const hareket = await query(`SELECT id FROM "StockMovement" WHERE note = $1 AND type = 'GIRIS' AND quantity = 3`, [not]);
  expect(hareket).toHaveLength(1);
});

test("stoksuz sevkiyatta gerekçe siparişi onaya gönderir; sevkiyat yazılmaz (A-8-9)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await page.goto("/shipping");
  const kart = page.locator("div.rounded-lg.border").filter({ hasText: s.doktorAdi });
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
  await expect(page.locator("div.rounded-lg.border").filter({ hasText: s.doktorAdi }).getByText("Onay bekliyor")).toBeVisible();
});
