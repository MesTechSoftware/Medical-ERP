import { test, expect } from "@playwright/test";
import { aramaliSec, unique } from "../helpers";
import { yatayTasmaYok } from "./ortak";

test.use({ storageState: "playwright/.auth/seller.json" });

/** Benzersiz, geçerli bir TR cep numarası (telefon benzersizdir, FR-09). */
function benzersizTelefon(): string {
  const n = String(Date.now()).slice(-7) + String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `05${n}`;
}

test("satıcı telefondan sipariş oluşturur", async ({ page }) => {
  await page.goto("/my-orders/new");
  await expect(page.getByLabel("Doktor")).toBeVisible();
  await yatayTasmaYok(page);
  await aramaliSec(page, "Doktor");
  await aramaliSec(page, "Ürün");
  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();
  await expect(page).toHaveURL(/\/my-orders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Siparişlerim" })).toBeVisible();
  await yatayTasmaYok(page);
});

test("satıcı telefondan doktor ekler", async ({ page }) => {
  const ad = unique("Dr Mobil");
  await page.goto("/my-doctors/new");
  await expect(page.getByLabel("Ad Soyad")).toBeVisible();
  await yatayTasmaYok(page);
  await page.getByLabel("Ad Soyad").fill(ad);
  await page.getByLabel("Klinik / Kurum").fill("Mobil Kliniği");
  await page.getByLabel("Bölge").fill("Marmara");
  await page.getByLabel("Telefon").fill(benzersizTelefon());
  await page.getByRole("button", { name: "Doktor Ekle" }).click();
  await expect(page).toHaveURL(/\/my-doctors$/);
  await expect(page.getByText(ad)).toBeVisible();
});
