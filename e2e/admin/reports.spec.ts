import { test, expect } from "@playwright/test";

/**
 * Faz F — raporlar.
 *
 * FR-62 satıcı performansı · FR-63 doktor sıralaması ·
 * FR-60 toplam ciro (kanal karşılaştırması C5'te, KDV toggle'ı C6'da söküldü).
 */

test("rapor sayfası satıcı ve doktor tablolarını gösterir (FR-62/FR-63)", async ({
  page,
}) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Satıcı Performansı" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Doktor Ciro Sıralaması/ })
  ).toBeVisible();
  await expect(page.getByText("Toplam Ciro")).toBeVisible();
  // GÇ-9: KDV toggle'ı C6'da söküldü — ciro daima KDV hariç (Ü-3 C sınıfı).
  await expect(page.getByRole("button", { name: "KDV Dahil" })).toHaveCount(0);
  // X-8: kanal karşılaştırması C5'te söküldü.
  await expect(page.getByText("Bayi Kanalı Ciro")).toHaveCount(0);
  // GÇ-4: kongre yükümlülüğü kartı C2'de söküldü.
  await expect(page.getByText("Açık Kongre Bakiyesi")).toHaveCount(0);
});

test("toplam ciro kartının tabanı KDV hariçtir (Ü-3 C sınıfı)", async ({ page }) => {
  // Ciro sevk edilen maldan (sevkiyat satırı) doğar (A-3); satırı yazan akış 1B madde 7'dedir.
  // CM → 1B arası tutar boştur (FAZ1 R-11) — tutarın doğrulaması 1B'ye taşındı.
  await page.goto("/reports");
  const card = page.getByText("Toplam Ciro").locator("..");
  await expect(card).toContainText("KDV hariç");
});
