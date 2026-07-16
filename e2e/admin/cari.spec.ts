import { test, expect, type Page } from "@playwright/test";
import { unique } from "../helpers";

// StatCard'ı etiketine göre bulan yardımcı (Toplam Satış / Toplam Ödeme / Güncel Bakiye).
function statCard(page: Page, label: string) {
  return page.locator("div.rounded-xl.border").filter({ hasText: label });
}

test("ödeme kaydı satıcının cari bakiyesine yansır", async ({ page }) => {
  // 1. Sipariş/ödemesi olmayan yeni bir satıcı oluştur (cari sıfırdan başlar).
  const name = unique("Cari Satıcı");
  const email = `${unique("cari")}@test.local`;

  await page.goto("/sellers/new");
  await page.getByLabel("Ad Soyad").fill(name);
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill("test123");
  await page.getByRole("button", { name: "Satıcı Ekle" }).click();
  await expect(page).toHaveURL(/\/sellers$/);

  // 2. Bu satıcıya 100 ₺ ödeme kaydet.
  await page.goto("/payments");
  await page.getByLabel("Satıcı").selectOption({ label: name });
  await page.getByLabel("Tutar (₺)").fill("100");
  await page.getByRole("button", { name: "Ödeme Kaydet" }).click();
  await expect(page.getByText("Ödeme kaydedildi.")).toBeVisible();

  // 3. Satıcı detayında cari değerlerini doğrula.
  await page.goto("/sellers");
  await page.getByRole("link", { name }).click();
  await expect(
    page.getByRole("heading", { level: 1, name })
  ).toBeVisible();

  await expect(statCard(page, "Toplam Satış")).toContainText("₺0,00");
  await expect(statCard(page, "Toplam Ödeme")).toContainText("₺100,00");
  // Satış yokken 100 ₺ ödeme → bakiye -100 (fazla ödeme).
  await expect(statCard(page, "Güncel Bakiye")).toContainText("100,00");
});
