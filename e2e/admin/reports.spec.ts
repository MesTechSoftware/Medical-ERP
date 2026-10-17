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
  await expect(page.getByText("Dönem Cirosu")).toBeVisible();
  // GÇ-9: KDV toggle'ı C6'da söküldü — ciro daima KDV hariç (Ü-3 C sınıfı).
  await expect(page.getByRole("button", { name: "KDV Dahil" })).toHaveCount(0);
  // X-8: kanal karşılaştırması C5'te söküldü.
  await expect(page.getByText("Bayi Kanalı Ciro")).toHaveCount(0);
  // GÇ-4: kongre yükümlülüğü kartı C2'de söküldü.
  await expect(page.getByText("Açık Kongre Bakiyesi")).toHaveCount(0);
});

test("dönem cirosu kartının tabanı KDV hariçtir (Ü-3 C sınıfı)", async ({ page }) => {
  // Ciro sevk edilen maldan (sevkiyat satırı) doğar (A-3); satırı yazan akış 1B madde 7'dedir.
  // CM → 1B arası tutar boştur (FAZ1 R-11) — tutarın doğrulaması 1B'ye taşındı.
  await page.goto("/reports");
  const card = page.getByText("Dönem Cirosu").locator("..");
  await expect(card).toContainText("KDV hariç");
});

test("dönem zorunludur: varsayılan içinde bulunulan ay, tüm zamanlar ayrı seçim (X-1-1)", async ({ page }) => {
  await page.goto("/reports");
  const buAy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" })
    .format(new Date())
    .slice(0, 7);
  await expect(page.locator("#donem")).toHaveValue(buAy);
  await expect(page.getByText(`${buAy} ayı gösteriliyor.`)).toBeVisible();
  // Üç mutlak sayı, oran yok (X-1 §(1)).
  // "Ciro (KDV hariç)" doktor tablosunda da var; satıcı tablosuna daraltılır.
  const saticiTablosu = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Hakediş" }) });
  for (const baslik of ["Ciro (KDV hariç)", "Hakediş", "Tahsilat (KDV dahil)"]) {
    await expect(saticiTablosu.getByRole("columnheader", { name: baslik, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/tahsilat oranı/i)).toHaveCount(0);

  await page.getByRole("link", { name: "Tüm zamanlar" }).click();
  await expect(page).toHaveURL(/donem=tum/);
  await expect(page.getByText("Tüm zamanlar gösteriliyor.")).toBeVisible();

  await page.locator("#donem").fill("2026-03");
  await page.getByRole("button", { name: "Göster" }).click();
  await expect(page).toHaveURL(/donem=2026-03/);
  await expect(page.getByText("2026-03 ayı gösteriliyor.")).toBeVisible();
});
