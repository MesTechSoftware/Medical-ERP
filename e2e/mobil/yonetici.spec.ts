import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";
import { dokunmaHedefi, telefonda, yatayTasmaYok } from "./ortak";

test.use({ storageState: "playwright/.auth/admin.json" });

const SAYFALAR = [
  "/dashboard",
  "/products",
  "/stock",
  "/price-lists",
  "/users",
  "/doctors",
  "/orders",
  "/shipping",
  "/approvals",
  "/collections",
  "/reports",
  "/audit-logs",
  "/exports",
  "/imports",
];

test("yönetici ekranlarında sayfa yatay kaymaz", async ({ page }) => {
  for (const yol of SAYFALAR) {
    await page.goto(yol);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await yatayTasmaYok(page, yol);
  }
});

test("detay sayfaları yatay kaymaz", async ({ page }) => {
  const [doktor] = await sorgu<{ id: string }>(`SELECT id FROM "Doctor" ORDER BY "createdAt" LIMIT 1`);
  const [satici] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'SATICI' ORDER BY "createdAt" LIMIT 1`);
  const [liste] = await sorgu<{ id: string }>(`SELECT id FROM "PriceList" ORDER BY "createdAt" LIMIT 1`);
  for (const yol of [`/doctors/${doktor.id}`, `/doctors/${doktor.id}/edit`, `/users/${satici.id}`, `/price-lists/${liste.id}`]) {
    await page.goto(yol);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await yatayTasmaYok(page, yol);
  }
});

test("menü öğeleri ve Çıkış dokunmatikte en az 44 px", async ({ page }) => {
  await page.goto("/dashboard");
  // Telefonda nav şeridi, tablette yan menü — ikisi de "Ana menü"; görünür olan tektir.
  const menu = page.getByRole("navigation", { name: "Ana menü" });
  // Akış tamamlanmadan (yükleme iskeleti) menü yoktur; önce görünmesini bekle.
  await expect(menu.getByRole("link").first()).toBeVisible();
  const linkler = await menu.getByRole("link").all();
  expect(linkler.length).toBeGreaterThan(0);
  for (const link of linkler) {
    await link.scrollIntoViewIfNeeded();
    await dokunmaHedefi(page, `menü: ${await link.innerText()}`, await link.boundingBox());
  }
  await dokunmaHedefi(page, "Çıkış", await page.getByRole("button", { name: "Çıkış" }).boundingBox());
});

test("telefon nav şeridi: aktif sayfa görünür alanda, sayfa kaymaz", async ({ page }) => {
  test.skip(!telefonda(page), "md ve üstünde yan menü görünür");
  const serit = page.getByRole("navigation", { name: "Ana menü" });

  // Şeridin en sağındaki öğe: açılışta görünür alana alınmalı.
  await page.goto("/imports");
  const aktifGorunur = async () => {
    const [s, a] = [await serit.boundingBox(), await serit.locator('[aria-current="page"]').boundingBox()];
    return !!s && !!a && a.x >= s.x - 1 && a.x + a.width <= s.x + s.width + 1;
  };
  await expect(serit.locator('[aria-current="page"]')).toHaveText("İçe Aktarım");
  await expect.poll(aktifGorunur).toBe(true);
  expect(await page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([0, 0]);

  await serit.getByRole("link", { name: "Siparişler" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(serit.locator('[aria-current="page"]')).toHaveText("Siparişler");
  await expect.poll(aktifGorunur).toBe(true);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

test("sipariş listesinden detaya gidilir", async ({ page }) => {
  await page.goto("/orders");
  await page.getByRole("link", { name: "Detay" }).first().click();
  await expect(page).toHaveURL(/\/orders\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sipariş Detayı" })).toBeVisible();
  await yatayTasmaYok(page);
});
