import { test, expect } from "@playwright/test";
import { sorgu } from "../helpers";

/** Ü-18 — cari listesi: yeni sütunlar, rozetler, eksik fatura vurgusu, boş durum (A-12-5 · A-13-3). */

const satir = (page: import("@playwright/test").Page, ad: string) =>
  page.getByRole("row").filter({ has: page.getByRole("link", { name: new RegExp(ad) }) });

test("yeni sütunlar: son sipariş tarihi ve bakiye (KDV dahil başlık)", async ({ page }) => {
  const [d] = await sorgu<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d JOIN "Order" o ON o."doctorId" = d.id
      WHERE o.stage = 'ONAYLI' AND o.status <> 'IPTAL' ORDER BY d."fullName" LIMIT 1`
  );
  await page.goto("/doctors?per=100");
  await expect(page.getByRole("columnheader", { name: "Son Sipariş" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Bakiye (KDV dahil)" })).toBeVisible();
  const r = satir(page, d.fullName);
  await expect(r.getByText(/^\d{2}\.\d{2}\.\d{4}$/)).toBeVisible();
  await expect(r.getByText(/^(bugün|\d+ gün önce)$/)).toBeVisible();
  await expect(r.getByText(/^(Doktor borçlu|Doktor alacaklı \(avans\)|Bakiye kapalı)$/)).toBeVisible();
});

test("eksik faturalı satır rozetli ve vurgulu (A-13-3)", async ({ page }) => {
  const [d] = await sorgu<{ fullName: string }>(
    `SELECT "fullName" FROM "Doctor" WHERE "invoiceAddress" IS NULL ORDER BY "fullName" LIMIT 1`
  );
  await page.goto("/doctors?per=100");
  const r = satir(page, d.fullName);
  await expect(r.getByText("Eksik fatura", { exact: true })).toBeVisible();
  await expect(r).toHaveClass(/bg-critical-bg/);
});

test("limiti aşan cari 'Limit aşıldı' rozeti taşır (A-12-5)", async ({ page }) => {
  const [d] = await sorgu<{ id: string; fullName: string; creditLimit: string | null }>(
    `SELECT d.id, d."fullName", d."creditLimit" FROM "Doctor" d
      JOIN "LedgerEntry" l ON l."doctorId" = d.id
      GROUP BY d.id
      HAVING SUM(CASE WHEN l.direction = 'BORC' THEN l.amount ELSE -l.amount END) > 1
      ORDER BY d."fullName" LIMIT 1`
  );
  expect(d).toBeTruthy();
  await sorgu(`UPDATE "Doctor" SET "creditLimit" = 1 WHERE id = $1`, [d.id]);
  try {
    await page.goto("/doctors?per=100");
    await expect(satir(page, d.fullName).getByText("Limit aşıldı")).toBeVisible();
  } finally {
    await sorgu(`UPDATE "Doctor" SET "creditLimit" = $2 WHERE id = $1`, [d.id, d.creditLimit]);
  }
});

test("süzgeç sonucu boşsa açıklayıcı boş durum ve Süzgeçleri temizle", async ({ page }) => {
  await page.goto("/doctors?bolge=E2E-Olmayan-Bolge");
  await expect(page.getByText("Bu süzgeçlere uyan cari bulunamadı.")).toBeVisible();
  await page.getByRole("link", { name: "Süzgeçleri temizle" }).click();
  await expect(page).toHaveURL(/\/doctors$/);
});
