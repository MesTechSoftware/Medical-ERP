import { test, expect, type Page } from "@playwright/test";
import { sorgu, yeniKullanici } from "../helpers";

/** Ü-22 — kullanıcılar ekranı: KPI, sekmeler, sütun seçici, yan panel (X-17-6). */

const kpi = (page: Page) => page.getByRole("region", { name: "Kullanıcı sayıları" });
const etkinler = (page: Page) => page.getByRole("list", { name: "Etkin süzgeçler" });
const satirlar = (page: Page) => page.locator("tbody tr:has(a[data-kayit])");

test("Portföysüz aktif satıcı kartı süzgeci açar; kart sayısı satır sayısına eşit (X-17-6)", async ({ page }) => {
  // Yeni satıcının portföyü boştur: kart en az 1 olur.
  await yeniKullanici(page, { role: "SATICI", prefix: "portfoysuz" });
  await page.goto("/users");
  const kart = kpi(page).getByRole("link", { name: /Portföysüz aktif satıcı/ });
  const deger = Number((await kart.innerText()).match(/\d+/)![0]);
  expect(deger).toBeGreaterThan(0);
  await kart.click();
  await expect(page).toHaveURL(/portfoy=yok/);
  await expect(etkinler(page).getByText("Portföy: Yok")).toBeVisible();
  await expect(satirlar(page)).toHaveCount(deger);
});

test("İlk girişi bekleyen kartı geçici parolalı aktif kullanıcıları listeler", async ({ page }) => {
  const email = await yeniKullanici(page, { role: "OPERASYON", prefix: "gecici" });
  await page.goto("/users");
  await kpi(page).getByRole("link", { name: /İlk girişi bekleyen/ }).click();
  await expect(page).toHaveURL(/durum=aktif&parola=gecici/);
  const satir = satirlar(page).filter({ hasText: email });
  await expect(satir.getByText("Geçici parola", { exact: true })).toBeVisible();
});

test("ad yan paneli açar: satıcıda özet, oturum, portföy ve son siparişler; yöneticiye prim ve son işlemler", async ({ page }) => {
  const [s] = await sorgu<{ id: string; name: string }>(`SELECT id, name FROM "User" WHERE email = 'ahmet@medikal.local'`);
  await page.goto("/users");
  await page.getByRole("link", { name: s.name }).click();
  await expect(page).toHaveURL(new RegExp(`detay=${s.id}`));
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: s.name })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Oturum" })).toContainText("Açık oturum");
  await expect(panel.getByRole("region", { name: "Portföy" })).toBeVisible();
  await expect(panel.getByRole("region", { name: "Son siparişler" })).toBeVisible();
  await expect(panel.getByText("Prim oranı")).toBeVisible();
  await expect(panel.getByRole("region", { name: "Son işlemler" })).toBeVisible();
  await panel.getByRole("link", { name: "Tam detaya git" }).click();
  await expect(page).toHaveURL(new RegExp(`/users/${s.id}$`));
});

test.describe("sütun seçici", () => {
  test.afterEach(async ({ context }) => {
    await context.clearCookies({ name: "kullanici-sutunlar" });
  });

  test("Son etkinlik sütunu gizlenir, yenilemede gizli kalır, varsayılana döner", async ({ page }) => {
    const baslik = () => page.getByRole("columnheader", { name: "Son etkinlik" });
    await page.goto("/users");
    await expect(baslik()).toBeVisible();
    await page.getByText("Sütunlar", { exact: true }).click();
    const menu = page.getByRole("form", { name: "Görünür sütunlar" });
    await menu.getByLabel("Son etkinlik").uncheck();
    await menu.getByRole("button", { name: "Kaydet" }).click();
    await expect(baslik()).toHaveCount(0);
    await page.reload();
    await expect(baslik()).toHaveCount(0);
    await page.getByText("Sütunlar", { exact: true }).click();
    await page.getByRole("form", { name: "Görünür sütunlar" }).getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(baslik()).toBeVisible();
  });
});

test("sayfa dışı adres son sayfaya gider; boş durum çıkmaz", async ({ page }) => {
  await page.goto("/users?page=999");
  await expect(page).not.toHaveURL(/page=999/);
  await expect(satirlar(page).first()).toBeVisible();
  await expect(page.getByText("Henüz kullanıcı yok.")).toHaveCount(0);
});
