import { test, expect } from "@playwright/test";

/**
 * X-3-1 — beklenmeyen hata sabit ekranla karşılanır. Tahsilat formunun cari seçimi veritabanının
 * kabul etmeyeceği bir değere (NUL baytı) çevrilir: sorgu düşer (teknik hata; olmayan cari artık iş hatasıdır, A-11-4).
 * Hata kritik segmentte (tahsilat) yakalanır; menü yerinde kalır, ayrıntı ekrana yazılmaz.
 */
test("teknik hata sabit metin + referans gösterir, ayrıntı sızdırmaz, menü kalır (X-3-1)", async ({ page }) => {
  await page.goto("/collections/new");
  await page.waitForLoadState("networkidle"); // hidrasyon formu yeniden kurmadan önce DOM'a dokunma
  const doktor = page.getByLabel("Cari");
  await doktor.evaluate((el: HTMLSelectElement) => {
    const o = document.createElement("option");
    o.value = "olmayan\u0000cari";
    o.text = "olmayan";
    el.appendChild(o);
    el.value = "olmayan\u0000cari";
  });
  await page.getByLabel("Tutar — KDV dahil (₺)").fill("100");
  await page.getByLabel("Yöntem").selectOption({ index: 1 });
  await expect(doktor).toHaveValue("olmayan\u0000cari");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();

  await expect(page.getByRole("heading", { name: "İşlem tamamlanamadı" })).toBeVisible();
  await expect(page.getByTestId("hata-referansi")).toHaveText(/\S+/);
  await expect(page.getByRole("link", { name: "Ana sayfaya dön" })).toBeVisible();
  // Segment sınırı: yönetim menüsü yerinde.
  await expect(page.locator("aside").getByRole("link", { name: "Tahsilatlar" })).toBeVisible();

  const metin = await page.locator("main").innerText();
  for (const sizinti of ["Prisma", "Foreign key", "doctorId", "olmayan", "constraint", "at "]) {
    expect(metin).not.toContain(sizinti);
  }
});
