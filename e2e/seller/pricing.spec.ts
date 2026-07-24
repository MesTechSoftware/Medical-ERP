import { test, expect } from "@playwright/test";

/**
 * Faz B — fiyatlandırma kuralları.
 *
 * RULE-03 / FR-12: satış birim fiyatı ürünün taban fiyatının (net) altına
 * inemez. Kritik nokta: bu kural SUNUCU TARAFINDA zorlanır; arayüzdeki
 * uyarı yalnızca kolaylık içindir.
 */

test("taban fiyatın altındaki birim fiyat arayüzde uyarır", async ({ page }) => {
  await page.goto("/my-orders/new");
  await page.getByLabel("Doktor").selectOption({ index: 1 });
  await page.getByLabel("Ürün").selectOption({ index: 1 });

  // Seed'de taban fiyat listenin %80'i; 0,01 ₺ her koşulda tabanın altındadır.
  await page.getByLabel("Birim (net)").fill("0.01");

  await expect(page.getByText(/taban fiyatın altında/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Siparişi Oluştur" })
  ).toBeDisabled();
});

test("taban fiyat kuralı arayüz atlansa bile SUNUCUDA zorlanır", async ({
  page,
}) => {
  await page.goto("/my-orders/new");
  await page.getByLabel("Doktor").selectOption({ index: 1 });
  await page.getByLabel("Ürün").selectOption({ index: 1 });
  await page.getByLabel("Birim (net)").fill("0.01");

  // Arayüz korumasını bilerek devre dışı bırak: asıl güvence sunucudadır
  // (RULE-03). Gizli `items` alanı zaten tabanın altındaki fiyatı taşıyor.
  const submit = page.getByRole("button", { name: "Siparişi Oluştur" });
  await submit.evaluate((el) => el.removeAttribute("disabled"));
  await submit.click();

  // Sunucu reddetmeli: sipariş oluşmamalı, hata mesajı görünmeli.
  await expect(page.getByText(/taban fiyatın altında olamaz/i)).toBeVisible();
  await expect(page).toHaveURL(/\/my-orders\/new/);
});

test("KDV Dahil/Hariç seçimi tutarları dönüştürür ve tercih hatırlanır", async ({
  page,
}) => {
  await page.goto("/my-orders/new");
  await page.getByLabel("Ürün").selectOption({ index: 1 });

  // Net modda 100 ₺ gir -> KDV %20 -> genel toplam 120 ₺ olmalı.
  await page.getByLabel("Birim (net)").fill("100");
  await expect(page.getByText("₺120,00")).toBeVisible();

  // KDV Dahil moduna geç: alan brüt değeri göstermeli (100 net -> 120 brüt).
  await page.getByRole("button", { name: "KDV Dahil" }).click();
  await expect(page.getByLabel("Birim (KDV dahil)")).toHaveValue("120");

  // Tercih çerezde saklanır: sayfa yenilenince KDV Dahil modu korunur.
  await page.reload();
  await expect(page.getByLabel("Birim (KDV dahil)")).toBeVisible();
});
