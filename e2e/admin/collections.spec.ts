import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Doktor cari ve tahsilat.
 *
 * FR-20/RULE-08 bakiye hareketlerden hesaplanır · FR-25 kısmi tahsilat ·
 * FR-29 iptal ters kayıt. FIFO mahsup ve yaşlandırma C3'te söküldü (GÇ-3, X-6).
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

/** Bir doktorun açık borcu = Σ sipariş(brüt, iptal hariç) − Σ aktif tahsilat. */
async function outstandingOf(doctorId: string): Promise<bigint> {
  const [row] = await query<{ bakiye: string }>(
    `SELECT (
        COALESCE((SELECT SUM(o."grossTotal") FROM "Order" o
                   WHERE o."doctorId" = $1 AND o.status <> 'CANCELLED'), 0)
      - COALESCE((SELECT SUM(p.amount) FROM "DoctorPayment" p
                   WHERE p."doctorId" = $1 AND p.status = 'AKTIF'), 0)
     )::text AS bakiye`,
    [doctorId]
  );
  return BigInt(row.bakiye);
}

async function pickDoctorWithDebt() {
  const [row] = await query<{ id: string; fullName: string; clinic: string }>(
    `SELECT d.id, d."fullName", d.clinic
       FROM "Doctor" d JOIN "Order" o ON o."doctorId" = d.id
      WHERE o.status <> 'CANCELLED'
      GROUP BY d.id, d."fullName", d.clinic
      LIMIT 1`
  );
  return row;
}

test("🔴 tahsilat iptali bakiyeyi eski haline getirir (FR-29)", async ({
  page,
}) => {
  const doctor = await pickDoctorWithDebt();
  const before = await outstandingOf(doctor.id);

  await page.goto("/collections");
  await page.getByLabel("Doktor").selectOption(doctor.id);
  await page.getByLabel("Tutar (₺)").fill("50");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
  await expect(page.getByText(/Tahsilat kaydedildi/)).toBeVisible();
  expect(await outstandingOf(doctor.id)).toBe(before - 5000n);

  // Az önce oluşturulan tahsilatı KESİN olarak hedefle: liste paidAt'e göre
  // sıralı ve eşit zaman damgalarında sıra belirsiz — .first() yanlış kaydı seçer.
  const [created] = await query<{ id: string }>(
    `SELECT id FROM "DoctorPayment"
      WHERE "doctorId" = $1 AND amount = 5000 AND status = 'AKTIF'
      ORDER BY "createdAt" DESC LIMIT 1`,
    [doctor.id]
  );
  expect(created).toBeTruthy();

  page.on("dialog", (d) => d.accept());
  await page.reload();
  await page
    .locator(`form[data-payment-id="${created.id}"] button`)
    .click();

  // Durumu VERİTABANINDAN doğrula (ekrandaki "İptal" metni "İptal Et"
  // butonuyla da eşleşiyor; zayıf assertion gerçek kanıt sayılmaz).
  await expect
    .poll(async () => {
      const [row] = await query<{ status: string }>(
        `SELECT status FROM "DoctorPayment" WHERE id = $1`,
        [created.id]
      );
      return row.status;
    })
    .toBe("IPTAL");

  // Ters kayıt: bakiye tam olarak eski değerine döndü.
  expect(await outstandingOf(doctor.id)).toBe(before);
});

test("FR-25: kısmi tahsilat bakiyeyi kısmen düşürür, borç sürer", async ({
  page,
}) => {
  const doctor = await pickDoctorWithDebt();
  const before = await outstandingOf(doctor.id);

  await page.goto("/collections");
  await page.getByLabel("Doktor").selectOption(doctor.id);
  await page.getByLabel("Tutar (₺)").fill("1");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
  await expect(page.getByText(/Tahsilat kaydedildi/)).toBeVisible();

  const after = await outstandingOf(doctor.id);
  expect(after).toBe(before - 100n);
  expect(after).toBeGreaterThan(0n); // borç tamamen kapanmadı
});

test("geçersiz tutar sunucuda reddedilir", async ({ page }) => {
  const doctor = await pickDoctorWithDebt();
  const before = await outstandingOf(doctor.id);

  await page.goto("/collections");
  await page.getByLabel("Doktor").selectOption(doctor.id);
  await page.getByLabel("Tutar (₺)").fill("0");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();

  await expect(page.getByText(/Geçerli bir tahsilat tutarı/)).toBeVisible();
  expect(await outstandingOf(doctor.id)).toBe(before); // hiçbir şey değişmedi
});
