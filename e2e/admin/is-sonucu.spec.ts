import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * X-4-4 — iş sonucunun gösterim deseni. `SERT` bildirim alanı olan formda alanın altında ve
 * alan işaretli; alansız işlemde (ürün silme) form kutusunda. Birden çok bildirim birlikte
 * gösterilir (X-4 §(7)).
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

test("SERT bildirimler alanlarının altında, alan işaretli; hepsi birlikte (X-4-4)", async ({ page }) => {
  await page.goto("/products/new");
  // Tarayıcının `required` kontrolünü geçen ama sunucuda boş kalan ad + geçersiz fiyat.
  await page.getByLabel("Ürün Adı").fill("   ");
  await page.getByLabel("Ürün Kodu").fill("X4-TEST");
  await page.getByLabel("Liste Fiyatı — KDV hariç (₺)").fill("abc");
  await page.getByRole("button", { name: "Ürün Ekle" }).click();

  const ad = page.getByLabel("Ürün Adı");
  const fiyat = page.getByLabel("Liste Fiyatı — KDV hariç (₺)");
  await expect(ad).toHaveAttribute("aria-invalid", "true");
  await expect(fiyat).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#name-hata")).toHaveText("Bu alan zorunludur.");
  await expect(page.locator("#listPrice-hata")).toHaveText("Geçerli bir tutar giriniz.");
  await expect(page.getByLabel("Ürün Kodu")).not.toHaveAttribute("aria-invalid", "true");
  // Alanın altında gösterilen bildirim form kutusunda tekrar edilmez.
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await expect(page).toHaveURL(/\/products\/new$/);
});

test("alansız işlemin SERT bildirimi form kutusunda; kayıt yerinde kalır (X-4-4)", async ({ page }) => {
  const [urun] = await query<{ id: string; name: string }>(
    `SELECT p.id, p.name FROM "Product" p WHERE EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."productId" = p.id) LIMIT 1`
  );
  expect(urun, "seed'de siparişte kullanılmış ürün olmalı").toBeDefined();

  // Liste sayfalıdır (Ü-19); seed ürünü e2e'nin eklediklerinin altında kalabilir.
  await page.goto("/products?per=100");
  page.once("dialog", (d) => d.accept());
  const satir = page.getByRole("row").filter({ hasText: urun.name }).first();
  await satir.getByRole("button", { name: "Sil" }).click();

  await expect(satir.getByRole("alert")).toHaveText(/siparişlerde kullanıldığı için silinemez/);
  expect(await query(`SELECT 1 FROM "Product" WHERE id = $1`, [urun.id])).toHaveLength(1);
});
