import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";

/** Dashboard sayfa özetleri (yönetici): menüdeki her sayfa için bir kart, bağlantısı kendi sayfasına. */

const KARTLAR: [string, string][] = [
  ["Siparişler", "/orders"],
  ["Kargo", "/shipping"],
  ["Onay Bekleyenler", "/approvals"],
  ["Stok", "/stock"],
  ["Ürünler", "/products"],
  ["Doktorlar", "/doctors"],
  ["Tahsilatlar", "/collections"],
  ["Fiyat Listeleri", "/price-lists"],
  ["Kullanıcılar", "/users"],
  ["Raporlar", "/reports"],
  ["Audit Log", "/audit-logs"],
  ["İçe Aktarım", "/imports"],
  ["Dışa Aktarım", "/exports"],
];

test("yönetici: 13 sayfa özeti sırasıyla, her biri kendi sayfasına bağlantı", async ({ page }) => {
  await page.goto("/dashboard");
  const ozetler = page.locator("[data-sayfa-ozetleri] > [role=group]");
  await expect(ozetler).toHaveCount(KARTLAR.length);
  expect(await ozetler.evaluateAll((k) => k.map((e) => e.getAttribute("aria-label")))).toEqual(KARTLAR.map(([ad]) => ad));
  for (const [ad, yol] of KARTLAR) {
    await expect(page.getByRole("group", { name: ad, exact: true }).getByRole("link", { name: ad })).toHaveAttribute("href", yol);
  }
  await page.getByRole("group", { name: "Stok", exact: true }).getByRole("link", { name: "Stok" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Stok" })).toBeVisible();
});

test("Stok kartı en düşük stoklu ürünü, Kargo kartı bu ay en çok sevk edilenleri taşır; Raporlar hakediş taşımaz", async ({ page }) => {
  // Bağımsız hesap: stok hareketlerin toplamıdır (giriş − çıkış).
  const [enDusuk] = await sorgu<{ name: string; stok: number }>(`
    SELECT p."name", COALESCE(SUM(CASE WHEN m."type" = 'GIRIS' THEN m."quantity" ELSE -m."quantity" END), 0)::int AS stok
    FROM "Product" p LEFT JOIN "StockMovement" m ON m."productId" = p."id"
    WHERE p."status" = 'AKTIF' GROUP BY p."id", p."name" ORDER BY stok, p."name" LIMIT 1`);
  await page.goto("/dashboard");
  const stok = page.getByRole("group", { name: "Stok", exact: true });
  if (enDusuk.stok <= 10) await expect(stok).toContainText(enDusuk.name);
  else await expect(stok).toContainText("Kritik stokta ürün yok.");

  await expect(page.getByRole("group", { name: "Kargo", exact: true })).toContainText("Bu ay en çok sevk edilenler");
  await expect(page.getByRole("group", { name: "Raporlar", exact: true })).not.toContainText(/hakediş/i);
  await expect(page.getByRole("group", { name: "Doktorlar", exact: true }).getByRole("link", { name: "Sahipsiz" })).toHaveAttribute(
    "href",
    "/doctors?sahip=yok"
  );
});
