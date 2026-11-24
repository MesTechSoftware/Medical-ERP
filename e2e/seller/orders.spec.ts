import { test, expect } from "@playwright/test";
import { aramaliSec } from "../helpers";

test("satıcı yeni sipariş oluşturur ve listesinde görür", async ({ page }) => {
  await page.goto("/my-orders/new");

  // Doktor artık serbest metin değil, portföyden seçilen bir varlık (BRK-02).
  const doctorName = (await aramaliSec(page, "Doktor")).split("—")[0].trim();

  await aramaliSec(page, "Ürün");
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Siparişlerim" })
  ).toBeVisible();
  // Listede unvansız ad geçer; unvanı ayıklayıp soyadıyla eşleştiriyoruz.
  const lastName = doctorName.split(" ").at(-1)!;
  await expect(page.getByText(lastName).first()).toBeVisible();
});

test("satıcı admin sayfasına erişince /my-orders'a yönlenir", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-orders/);
});

test("promosyon bedelsiz satır gerekçe ister; sipariş kaydolur ve onay bekler (A-2-2)", async ({ page }) => {
  await page.goto("/my-orders/new");
  await aramaliSec(page, "Doktor");
  await aramaliSec(page, "Ürün");
  await page.getByLabel("Bedelsiz", { exact: true }).check();
  await page.getByLabel("Bedelsiz sebebi").selectOption("PROMOSYON");
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  const diyalog = page.getByRole("dialog");
  await expect(diyalog).toContainText("Bedelsiz satır");
  await expect(diyalog).toContainText("Promosyon");
  await diyalog.getByLabel("Gerekçe").fill("Kongre standı için");
  await diyalog.getByRole("button", { name: "Gerekçeyle devam et" }).click();

  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(page.getByText("Onay bekliyor").first()).toBeVisible();
});


test("birim fiyat değişince canlı yüzde iskonto görünür; 0 fiyat uyarı verir (A-10-2, A-10-3, A-10-5)", async ({ page }) => {
  await page.goto("/my-orders/new");
  await aramaliSec(page, "Doktor");
  await aramaliSec(page, "Ürün");
  const fiyat = page.getByLabel(/^Birim/);
  // Cari/barem fiyatı çözülünce liste fiyatı kutunun yer tutucusunda görünür.
  await expect(fiyat).toHaveAttribute("placeholder", /^\d/);
  const liste = Number(await fiyat.getAttribute("placeholder"));
  await fiyat.fill(String(liste / 2));
  await expect(page.locator("[data-iskonto]")).toContainText(/%(49|50)[,\d]* iskonto/);

  await fiyat.fill("0");
  await expect(page.getByText("Birim fiyat 0'dan büyük olmalı")).toBeVisible();
});
