import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz F — raporlar.
 *
 * FR-62 satıcı performansı · FR-63 doktor sıralaması ·
 * FR-60 toplam ciro (kanal karşılaştırması C5'te, KDV toggle'ı C6'da söküldü).
 */

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

test("rapor sayfası satıcı ve doktor tablolarını gösterir (FR-62/FR-63)", async ({
  page,
}) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Satıcı Performansı" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Doktor Ciro Sıralaması/ })
  ).toBeVisible();
  await expect(page.getByText("Toplam Ciro")).toBeVisible();
  // GÇ-9: KDV toggle'ı C6'da söküldü — ciro daima KDV hariç (Ü-3 C sınıfı).
  await expect(page.getByRole("button", { name: "KDV Dahil" })).toHaveCount(0);
  // X-8: kanal karşılaştırması C5'te söküldü.
  await expect(page.getByText("Bayi Kanalı Ciro")).toHaveCount(0);
  // GÇ-4: kongre yükümlülüğü kartı C2'de söküldü.
  await expect(page.getByText("Açık Kongre Bakiyesi")).toHaveCount(0);
});

test("toplam ciro kartı KDV hariç tutarı gösterir (Ü-3 C sınıfı)", async ({ page }) => {
  const [row] = await query<{ net: string; gross: string }>(
    `SELECT COALESCE(SUM("netTotal"),0)::text AS net,
            COALESCE(SUM("grossTotal"),0)::text AS gross
       FROM "Order" WHERE status <> 'CANCELLED'`
  );
  const net = BigInt(row.net);
  const gross = BigInt(row.gross);
  expect(gross).toBeGreaterThan(net); // KDV var — ayrım anlamlı

  const digits = (k: bigint) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(
      Number(k) / 100
    );

  await page.goto("/reports");
  const card = page.getByText("Toplam Ciro").locator("..");
  await expect(card).toContainText(digits(net));
  await expect(card).toContainText("KDV hariç");
  await expect(card).not.toContainText(digits(gross));
});
