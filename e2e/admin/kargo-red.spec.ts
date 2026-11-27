import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/** Ü-42 M1 — Kargo bekleyende RED'li iskonto/bedelsiz sipariş seçilemez, "iptal edilmeli" yönlendirmesi taşır (A-8-18). */

test("RED'li ISKONTO_TAVANI siparişi Kargo'da seçilemez ve iptal edilmeli yazar", async ({ page }) => {
  const s = await stoksuzSiparis();
  const [yonetici] = await sorgu<{ id: string }>(`SELECT id FROM "User" WHERE role = 'YONETICI' LIMIT 1`);
  await sorgu(`UPDATE "Order" SET status = 'HAZIRLANIYOR', stage = 'ONAYLI' WHERE id = $1`, [s.siparisId]);
  await sorgu(
    `INSERT INTO "ApprovalBlock" (id, "documentType", "documentId", "ruleCode", "openReason", "openedById", decision, "decidedById", "decidedAt", "decisionNote")
     VALUES ($1, 'SIP', $2, 'ISKONTO_TAVANI', 'e2e', $3, 'RED', $3, now(), 'e2e red')`,
    [`e2e-red-${s.siparisId}`, s.siparisId, yonetici.id]
  );
  await page.goto("/shipping");
  const satir = page.locator("tr", { hasText: s.documentNo });
  await expect(satir).toContainText("iptal edilmeli");
  await expect(satir.getByRole("checkbox")).toHaveCount(0);
});
