import { test, expect } from "@playwright/test";
import { Client } from "pg";

/** K-4-2 — Fatura Hazırlık Kartı satıcı sipariş sayfasında yoktur; kart yönetim ekranına özeldir. */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

test("satıcı sipariş sayfasında sevkiyat görünür, Fatura Hazırlık Kartı görünmez (K-4-2)", async ({ page }) => {
  const client = new Client({ connectionString });
  await client.connect();
  let siparisId: string;
  try {
    const { rows } = await client.query<{ id: string }>(
      `SELECT o.id FROM "Order" o JOIN "User" u ON u.id = o."sellerId"
       WHERE u.email = 'ahmet@medikal.local' AND EXISTS (SELECT 1 FROM "Shipment" s WHERE s."orderId" = o.id)
       ORDER BY o."documentNo" LIMIT 1`
    );
    siparisId = rows[0].id;
  } finally {
    await client.end();
  }
  await page.goto(`/my-orders/${siparisId}`);
  await expect(page.locator("[data-sevkiyat]").first()).toBeVisible();
  await expect(page.locator("[data-fatura-karti]")).toHaveCount(0);
  await expect(page.getByText("Fatura Hazırlık")).toHaveCount(0);
});
