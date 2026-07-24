import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * FR-10: Doktor detayı — cari, vade, sipariş/tahsilat geçmişi, kongre defteri.
 * FR-57: Admin GEREKÇELİ manuel kongre bakiyesi düzeltmesi (RULE-13 audit).
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

async function balanceOf(doctorId: string): Promise<bigint> {
  const [row] = await query<{ bakiye: string }>(
    `SELECT COALESCE(SUM("remainingAmount"), 0)::text AS bakiye
       FROM "CongressLedger"
      WHERE "doctorId" = $1 AND type IN ('EARN','ADJUST')
        AND "remainingAmount" > 0
        AND ("expiresAt" IS NULL OR "expiresAt" > now())`,
    [doctorId]
  );
  return BigInt(row.bakiye);
}

async function pickDoctor() {
  const [d] = await query<{ id: string; fullName: string }>(
    `SELECT id, "fullName" FROM "Doctor" ORDER BY "fullName" LIMIT 1`
  );
  return d;
}

test("FR-10: doktor detayı cari, yaşlandırma ve kongre defterini gösterir", async ({
  page,
}) => {
  const doctor = await pickDoctor();
  await page.goto(`/doctors/${doctor.id}`);

  await expect(page.getByText("Cari Bakiye")).toBeVisible();
  await expect(page.getByText("Vadesi Geçmiş").first()).toBeVisible();
  await expect(page.getByText("Kongre Bakiyesi")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sipariş Geçmişi" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tahsilat Geçmişi" })
  ).toBeVisible();
});

test("🔴 FR-57: admin gerekçeli manuel düzeltme girer, bakiye ve audit güncellenir", async ({
  page,
}) => {
  const doctor = await pickDoctor();
  const before = await balanceOf(doctor.id);

  await page.goto(`/doctors/${doctor.id}`);
  await page.getByLabel("Tutar (₺) — negatif = düşüm").fill("250");
  await page.getByLabel("Gerekçe (zorunlu)").fill("E2E manuel düzeltme testi");
  await page.getByRole("button", { name: "Düzeltme Uygula" }).click();

  await expect
    .poll(async () => (await balanceOf(doctor.id)).toString())
    .toBe((before + 25000n).toString());

  // RULE-13: düzeltme denetim izine yazıldı.
  const audit = await query(
    `SELECT id FROM "AuditLog"
      WHERE action = 'CONGRESS_BALANCE_ADJUST' AND "entityId" = $1`,
    [doctor.id]
  );
  expect(audit.length).toBeGreaterThan(0);

  // Defterde ADJUST satırı ve gerekçe görünür.
  await page.reload();
  await expect(page.getByText("E2E manuel düzeltme testi")).toBeVisible();
});

test("FR-57: gerekçesiz düzeltme reddedilir (denetim izi zorunlu)", async ({
  page,
}) => {
  const doctor = await pickDoctor();
  const before = await balanceOf(doctor.id);

  await page.goto(`/doctors/${doctor.id}`);
  await page.getByLabel("Tutar (₺) — negatif = düşüm").fill("100");
  await page.getByLabel("Gerekçe (zorunlu)").fill("xx"); // 5 karakterden kısa
  await page.getByRole("button", { name: "Düzeltme Uygula" }).click();

  await expect(page.getByText(/Gerekçe zorunludur/i)).toBeVisible();
  expect(await balanceOf(doctor.id)).toBe(before);
});

test("FR-57: bakiyeden fazla düşüm reddedilir (RULE-07)", async ({ page }) => {
  const doctor = await pickDoctor();
  const before = await balanceOf(doctor.id);

  await page.goto(`/doctors/${doctor.id}`);
  // Mevcut bakiyenin çok üstünde bir düşüm dene.
  const tooMuch = Number(before / 100n) + 100000;
  await page
    .getByLabel("Tutar (₺) — negatif = düşüm")
    .fill(String(-tooMuch));
  await page.getByLabel("Gerekçe (zorunlu)").fill("Aşırı düşüm denemesi");
  await page.getByRole("button", { name: "Düzeltme Uygula" }).click();

  await expect(page.getByText(/yeterli bakiye yok/i)).toBeVisible();
  expect(await balanceOf(doctor.id)).toBe(before); // hiçbir şey değişmedi
});
