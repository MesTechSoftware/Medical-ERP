import { test, expect, type Page } from "@playwright/test";
import { USERS, kpiIskeletiEslesir, kpiKartlariTasmaz } from "../helpers";

/** Ü-34 — Hesabım: kartlar öbür satıcı ekranlarının kartlarıyla aynı sayıdır; profil; iskelet. */

const kart = (page: Page, ad: string) => page.getByRole("group", { name: ad, exact: true });
const deger = async (page: Page, ad: string) => (await kart(page, ad).innerText()).split("\n").map((s) => s.trim()).find((s) => /^₺?[\d.]+(,\d{2})?$/.test(s));

test("Doktorlarım, Bu ay siparişim ve Bu ay cirom kartları Doktorlarım, Siparişlerim ve Raporum'daki kartlarla aynı", async ({ page }) => {
  await page.goto("/account");
  const hesap = {
    doktor: await deger(page, "Doktorlarım"),
    siparis: await deger(page, "Bu ay siparişim"),
    ciro: await deger(page, "Bu ay cirom"),
  };
  expect(hesap.doktor).toMatch(/^\d+$/);
  expect(hesap.siparis).toMatch(/^\d+$/);
  expect(hesap.ciro).toMatch(/^₺/);

  await page.goto("/my-doctors");
  expect(await deger(page, "Doktorlarım")).toBe(hesap.doktor);
  await page.goto("/my-orders");
  expect(await deger(page, "Toplam sipariş")).toBe(hesap.siparis);
  await page.goto("/my-report");
  expect(await deger(page, "Cirom")).toBe(hesap.ciro);
});

test("profil: e-posta, rol, prim oranı ve ortalama iskonto; kart Doktorlarım'a gider", async ({ page }) => {
  await page.goto("/account");
  const profil = page.getByRole("region", { name: "Profil" });
  await expect(profil).toContainText(USERS.seller.email);
  await expect(profil).toContainText("Satıcı");
  await expect(profil).toContainText("Prim oranım");
  await expect(profil).toContainText(/Ortalama iskontom\s*%/);
  await page.getByRole("region", { name: "Hesap özeti" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/my-doctors$/);
});

test("kartlar taşmaz; iskelet gerçek kartlarla eşleşir", async ({ page }) => {
  await page.goto("/account");
  await kpiKartlariTasmaz(page);
  await kpiIskeletiEslesir(page, "/account");
});
