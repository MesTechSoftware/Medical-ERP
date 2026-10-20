import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/**
 * A-8 — negatif stok onayı ekrandan (A-8 eki 20.10.2026): gerekçe diyaloğu, yöneticinin
 * gerekçeyle sevki, onay bekleyenler ekranında karar.
 */

test("yönetici stoksuz ürünü gerekçeyle kısmen sevk eder; girilen miktar diyalogdan sonra korunur (A-8-8)", async ({ page }) => {
  const s = await stoksuzSiparis();
  await page.goto("/shipping");
  const kart = page.locator("div.rounded-lg.border").filter({ hasText: s.doktorAdi });
  await kart.locator(`#miktar_${s.kalemId}`).fill("1");
  await kart.getByRole("button", { name: "Kargola" }).click();

  const diyalog = kart.getByRole("dialog");
  await expect(diyalog).toContainText(`Stok yetersiz (${s.urunAdi}): işlem sonrası stok -1 adet olur.`);
  await diyalog.getByLabel("Gerekçe").fill("Mal depoda, girişi yapılmadı");
  await diyalog.getByRole("button", { name: "Gerekçeyle devam et" }).click();

  await expect(page.locator("div.rounded-lg.border").filter({ hasText: s.doktorAdi }).getByText("kalan 1/2")).toBeVisible();
  const [kalem] = await sorgu<{ quantity: number }>(`SELECT quantity FROM "ShipmentItem" WHERE "orderItemId" = $1`, [s.kalemId]);
  expect(kalem.quantity).toBe(1);
  const [blok] = await sorgu<{ decision: string; openReason: string }>(
    `SELECT decision::text, "openReason" FROM "ApprovalBlock" WHERE "documentId" = $1`,
    [s.siparisId]
  );
  expect(blok).toEqual({ decision: "ONAY", openReason: "Mal depoda, girişi yapılmadı" });
});

test("onay bekleyenler: yönetici karar notuyla onaylar, talep listeden düşer (A-8)", async ({ page }) => {
  const s = await stoksuzSiparis();
  const [operasyon] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'OPERASYON' LIMIT 1`);
  const blokId = `e2e-blok-${s.siparisId}`;
  await sorgu(
    `INSERT INTO "ApprovalBlock" (id, "documentType", "documentId", "ruleCode", "openedById", "openReason")
     VALUES ($1, 'SIP', $2, 'NEGATIF_STOK', $3, 'Acil vaka')`,
    [blokId, s.siparisId, operasyon.id]
  );

  await page.goto("/approvals");
  const kart = page.locator(`[data-blok-id="${blokId}"]`);
  await expect(kart).toContainText("Negatif stok");
  await expect(kart).toContainText(s.documentNo);
  await expect(kart).toContainText("Acil vaka");
  await kart.getByLabel("Karar notu").fill("Uygun, sevk edilsin");
  await kart.getByRole("button", { name: "Onayla" }).click();
  await expect(kart).toHaveCount(0);

  const [blok] = await sorgu<{ decision: string; decisionNote: string }>(
    `SELECT decision::text, "decisionNote" FROM "ApprovalBlock" WHERE id = $1`,
    [blokId]
  );
  expect(blok).toEqual({ decision: "ONAY", decisionNote: "Uygun, sevk edilsin" });
});
