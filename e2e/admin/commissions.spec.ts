import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz C2 — satıcı primi.
 *
 * FR-33/D-16/D-17 matrah = tahsil edilen, KDV hariç ·
 * FR-34 dönem kapanışı matrahı DONDURUR ·
 * 🔴 RULE-05/FR-35 kapanmış dönem ASLA değişmez; iptal sonraki döneme negatif yansır ·
 * FR-36 HESAPLANDI → ONAYLANDI → ÖDENDİ.
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

function previousPeriod() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Geçen aya ait bir tahsilat kurar: doktorun açık siparişine mahsup eder ve
 * ödeme tarihini geçmişe alır. Kapanış testleri geçmiş dönem gerektiriyor.
 */
async function seedBackdatedPayment(amountKurus: bigint) {
  const [order] = await query<{
    id: string;
    doctorId: string;
    sellerId: string;
    grossTotal: string;
    netTotal: string;
  }>(
    `SELECT id, "doctorId", "sellerId", "grossTotal"::text, "netTotal"::text
       FROM "Order" WHERE status <> 'CANCELLED' ORDER BY "dueDate" ASC LIMIT 1`
  );
  const prev = previousPeriod();
  const paidAt = new Date(prev.year, prev.month - 1, 15).toISOString();

  const [payment] = await query<{ id: string }>(
    `INSERT INTO "DoctorPayment"
       (id, "doctorId", amount, method, "paidAt", status, "recordedBy", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'TRANSFER', $3, 'AKTIF',
             (SELECT id FROM "User" WHERE role='ADMIN' LIMIT 1), now())
     RETURNING id`,
    [order.doctorId, amountKurus.toString(), paidAt]
  );

  await query(
    `INSERT INTO "PaymentAllocation" (id, "paymentId", "orderId", amount, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, now())`,
    [payment.id, order.id, amountKurus.toString()]
  );

  return { paymentId: payment.id, order, prev };
}

async function getPeriod(sellerId: string, year: number, month: number) {
  const [row] = await query<{
    id: string;
    baseAmount: string;
    commissionAmount: string;
    status: string;
    ratePercent: number;
  }>(
    `SELECT id, "baseAmount"::text, "commissionAmount"::text, status, "ratePercent"
       FROM "CommissionPeriod"
      WHERE "sellerId" = $1 AND year = $2 AND month = $3`,
    [sellerId, year, month]
  );
  return row;
}

test("🔴 kapanmış dönem DONDURULUR ve tahsilat iptali onu DEĞİŞTİRMEZ (RULE-05/FR-35)", async ({
  page,
}) => {
  const { paymentId, order, prev } = await seedBackdatedPayment(10_000n); // 100 ₺

  // --- Dönemi kapat (FR-34) ---
  await page.goto("/commissions");
  await page
    .locator(`form[data-close-period="${order.sellerId}"] button`)
    .click();

  // Başarı mesajı FORMUN İÇİNDE; dönem kapanınca form unmount olduğu için
  // mesaj da kaybolur. Gerçek kanıt kaydın kendisidir.
  await expect
    .poll(async () =>
      (await getPeriod(order.sellerId, prev.year, prev.month)) ? "kapandı" : "açık"
    )
    .toBe("kapandı");

  const closed = await getPeriod(order.sellerId, prev.year, prev.month);
  expect(BigInt(closed.baseAmount)).toBeGreaterThan(0n);
  expect(BigInt(closed.baseAmount)).toBeGreaterThan(0n);

  // D-17: matrah NET olmalı — brüt tahsilattan küçük (KDV hariç).
  expect(BigInt(closed.baseAmount)).toBeLessThan(10_000n);
  // %5 prim
  expect(BigInt(closed.commissionAmount)).toBe(
    (BigInt(closed.baseAmount) * 5n + 50n) / 100n
  );

  const frozenBase = closed.baseAmount;
  const frozenCommission = closed.commissionAmount;

  // --- Şimdi o dönemin tahsilatını iptal et ---
  page.on("dialog", (d) => d.accept());
  await page.goto("/collections");
  await page.locator(`form[data-payment-id="${paymentId}"] button`).click();

  await expect
    .poll(async () => {
      const [r] = await query<{ status: string }>(
        `SELECT status FROM "DoctorPayment" WHERE id = $1`,
        [paymentId]
      );
      return r.status;
    })
    .toBe("IPTAL");

  // 🔴 Kapanmış dönem AYNEN duruyor.
  const after = await getPeriod(order.sellerId, prev.year, prev.month);
  expect(after.baseAmount).toBe(frozenBase);
  expect(after.commissionAmount).toBe(frozenCommission);

  // 🔴 Düzeltme SONRAKİ (güncel) döneme NEGATİF yazıldı.
  const now = new Date();
  const adjustments = await query<{ amount: string; reason: string }>(
    `SELECT amount::text, reason FROM "CommissionAdjustment"
      WHERE "sellerId" = $1 AND year = $2 AND month = $3
        AND "sourcePaymentId" = $4`,
    [order.sellerId, now.getFullYear(), now.getMonth() + 1, paymentId]
  );
  expect(adjustments).toHaveLength(1);
  expect(BigInt(adjustments[0].amount)).toBeLessThan(0n);
  expect(BigInt(adjustments[0].amount)).toBe(-BigInt(frozenBase));
});

test("FR-34: açık (içinde bulunulan) dönem kapatılamaz", async ({ page }) => {
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE role = 'SELLER' ORDER BY name LIMIT 1`
  );
  const now = new Date();

  // Açık dönem tablosunda kapatma butonu HİÇ render edilmez: "Dönemi Kapat"
  // yalnızca "Kapatılabilir Dönem" (geçmiş ay) bölümünde çıkar.
  await page.goto("/commissions");
  const openSection = page
    .locator("section, div")
    .filter({ hasText: `Açık Dönem — ` });
  await expect(openSection.getByRole("button", { name: "Dönemi Kapat" })).toHaveCount(
    0
  );

  // Ve içinde bulunulan dönem için hiçbir kayıt oluşmamış olmalı.
  const row = await getPeriod(seller.id, now.getFullYear(), now.getMonth() + 1);
  expect(row).toBeFalsy();
});

test("FR-36: prim durumu HESAPLANDI → ONAYLANDI → ÖDENDİ ilerler", async ({
  page,
}) => {
  const [existing] = await query<{ id: string; status: string }>(
    `SELECT id, status FROM "CommissionPeriod" WHERE status = 'HESAPLANDI' LIMIT 1`
  );
  test.skip(!existing, "kapanmış dönem yok (önceki test atlanmış olabilir)");

  await page.goto("/commissions");
  await page.locator(`form[data-period-id="${existing.id}"] button`).click();
  await expect
    .poll(async () => {
      const [r] = await query<{ status: string }>(
        `SELECT status FROM "CommissionPeriod" WHERE id = $1`,
        [existing.id]
      );
      return r.status;
    })
    .toBe("ONAYLANDI");

  await page.locator(`form[data-period-id="${existing.id}"] button`).click();
  await expect
    .poll(async () => {
      const [r] = await query<{ status: string }>(
        `SELECT status FROM "CommissionPeriod" WHERE id = $1`,
        [existing.id]
      );
      return r.status;
    })
    .toBe("ODENDI");
});

test("aynı dönem iki kez kapatılamaz", async ({ page }) => {
  const [closed] = await query<{ sellerId: string; year: number; month: number }>(
    `SELECT "sellerId", year, month FROM "CommissionPeriod" LIMIT 1`
  );
  test.skip(!closed, "kapanmış dönem yok");

  const countBefore = await query(
    `SELECT id FROM "CommissionPeriod"
      WHERE "sellerId" = $1 AND year = $2 AND month = $3`,
    [closed.sellerId, closed.year, closed.month]
  );
  expect(countBefore).toHaveLength(1);

  // Kapanmış dönem için arayüzde buton görünmemeli.
  await page.goto("/commissions");
  await expect(
    page.locator(`form[data-close-period="${closed.sellerId}"]`)
  ).toHaveCount(0);
});
