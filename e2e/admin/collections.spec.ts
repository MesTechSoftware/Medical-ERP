import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz C1 — doktor cari, vade, tahsilat ve mahsuplaşma.
 *
 * FR-20/RULE-08 bakiye hareketlerden hesaplanır · D-18/FR-24 FIFO mahsup ·
 * FR-25 kısmi tahsilat · FR-29 iptal ters kayıt · RULE-12 tek transaction.
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

test("tahsilat kaydedilir, FIFO ile en eski vadeye mahsup edilir (D-18)", async ({
  page,
}) => {
  const doctor = await pickDoctorWithDebt();
  expect(doctor, "borcu olan doktor yok").toBeTruthy();

  const before = await outstandingOf(doctor.id);
  expect(before).toBeGreaterThan(0n);

  // Doktorun EN ESKİ vadeli açık siparişi — FIFO buraya yazmalı.
  const [oldest] = await query<{ id: string }>(
    `SELECT o.id FROM "Order" o
      WHERE o."doctorId" = $1 AND o.status <> 'CANCELLED'
      ORDER BY o."dueDate" ASC LIMIT 1`,
    [doctor.id]
  );

  await page.goto("/collections");
  await page.getByLabel("Doktor").selectOption(doctor.id);
  await page.getByLabel("Tutar (₺)").fill("100");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
  await expect(page.getByText(/Tahsilat kaydedildi/)).toBeVisible();

  // FR-20: bakiye 100 ₺ (=10000 kuruş) azaldı.
  expect(await outstandingOf(doctor.id)).toBe(before - 10000n);

  // D-18: mahsup EN ESKİ vadeli siparişe yazıldı.
  const allocs = await query<{ orderId: string; amount: string }>(
    `SELECT a."orderId", a.amount::text FROM "PaymentAllocation" a
       JOIN "DoctorPayment" p ON p.id = a."paymentId"
      WHERE p."doctorId" = $1 ORDER BY a."createdAt" DESC LIMIT 1`,
    [doctor.id]
  );
  expect(allocs).toHaveLength(1);
  expect(allocs[0].orderId).toBe(oldest.id);
});

test("🔴 tahsilat iptali mahsupları geri alır ve bakiyeyi eski haline getirir (FR-29)", async ({
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

  // Bu tahsilatın mahsupları silindi.
  const remaining = await query(
    `SELECT id FROM "PaymentAllocation" WHERE "paymentId" = $1`,
    [created.id]
  );
  expect(remaining).toHaveLength(0);
});

test("FR-25: kısmi tahsilat siparişi kısmen kapatır, kalan borç sürer", async ({
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

test("yaşlandırma özeti ekranda görünür (FR-26)", async ({ page }) => {
  await page.goto("/collections");
  for (const label of [
    "Vadesi gelmemiş",
    "1-30 gün",
    "31-60 gün",
    "61-90 gün",
    "90+ gün",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
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
