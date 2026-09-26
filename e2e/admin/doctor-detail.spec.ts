import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * FR-10: Doktor detayı — cari, vade, sipariş/tahsilat geçmişi.
 * Kongre defteri ve FR-57 manuel düzeltme C2'de söküldü (GÇ-5, K-6).
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

async function pickDoctor() {
  const [d] = await query<{ id: string; fullName: string }>(
    `SELECT id, "fullName" FROM "Doctor" ORDER BY "fullName" LIMIT 1`
  );
  return d;
}

test("FR-10: doktor detayı cari ve yaşlandırmayı gösterir, kongre defteri yok", async ({
  page,
}) => {
  const doctor = await pickDoctor();
  await page.goto(`/doctors/${doctor.id}`);

  await expect(page.getByText("Cari Bakiye")).toBeVisible();
  await expect(page.getByText("Vadesi Geçmiş").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sipariş Geçmişi" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tahsilat Geçmişi" })
  ).toBeVisible();
  // GÇ-5: doktorda teşvik anlamı taşıyan bakiye gösterilmez.
  await expect(page.getByText("Kongre Bakiyesi")).toHaveCount(0);
});
