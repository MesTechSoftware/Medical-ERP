import { test, expect } from "@playwright/test";
import { sorgu, stoksuzSiparis } from "../helpers";

/**
 * A-1-1 — iade sipariş detayından: sevk edilen kalemden kısmi iade, zorunlu sebep, cari alacak.
 */
test("sevk edilen 2 kalemden 1'i sebebiyle iade edilir; sebepsiz iade alanın altında reddedilir (A-1-1)", async ({ page }) => {
  const s = await stoksuzSiparis({ stoklu: true });
  await page.goto("/shipping");
  await page.locator("[data-sevk-karti]").filter({ hasText: s.doktorAdi }).getByRole("button", { name: "Kargola" }).click();
  await expect(page.locator("[data-sevk-karti]").filter({ hasText: s.doktorAdi })).toHaveCount(0);

  await page.goto(`/orders/${s.siparisId}`);
  await expect(page.getByText("iade edilebilir 2")).toBeVisible();
  await page.locator(`#iade_${s.kalemId}`).fill("1");
  await page.getByRole("button", { name: "İade Kaydet" }).click();
  await expect(page.getByText("Gerekçe zorunludur.")).toBeVisible();
  await expect(page.locator(`#iade_${s.kalemId}`)).toHaveValue("1");

  await page.getByLabel("İade sebebi").fill("Ambalaj hasarlı");
  await page.getByRole("button", { name: "İade Kaydet" }).click();
  await expect(page.getByRole("status").filter({ hasText: /İade kaydedildi: IAD-/ })).toBeVisible();
  await expect(page.getByText("iade edilebilir 1")).toBeVisible();

  const [h] = await sorgu<{ type: string; direction: string; amount: string }>(
    `SELECT l.type::text, l.direction::text, l.amount::text FROM "LedgerEntry" l
     JOIN "ReturnNote" r ON r.id = l."returnNoteId" JOIN "Doctor" d ON d.id = r."doctorId" WHERE d."fullName" = $1`,
    [s.doktorAdi]
  );
  expect(h).toEqual({ type: "IADE", direction: "ALACAK", amount: "120.00" });
});
