import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz E — kongre bakiyesi.
 *
 * FR-49/D-11 tahsilat → EARN (%100, NET matrah) · FR-50 son kullanma +12 ay ·
 * FR-51/RULE-11 FIFO · FR-54/D-12 yetersiz bakiyede SERT RED ·
 * 🔴 RULE-09 aynı bakiye iki pakete aynı anda harcanamaz (YARIŞ TESTİ) ·
 * FR-56 iptalde iade ama son kullanma UZAMAZ.
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

/** Doktora doğrudan bakiye yükler (test kurulumu). */
async function grantBalance(doctorId: string, amount: bigint, earnedAt = new Date()) {
  const expires = new Date(earnedAt);
  expires.setFullYear(expires.getFullYear() + 1);
  const [row] = await query<{ id: string }>(
    `INSERT INTO "CongressLedger"
       (id, "doctorId", type, amount, "earnedAt", "expiresAt", "remainingAmount", "createdAt")
     VALUES (gen_random_uuid()::text, $1, 'EARN', $2, $3, $4, $2, now())
     RETURNING id`,
    [doctorId, amount.toString(), earnedAt.toISOString(), expires.toISOString()]
  );
  return row.id;
}

async function pickDoctor() {
  const [d] = await query<{ id: string; fullName: string }>(
    `SELECT id, "fullName" FROM "Doctor" WHERE status = 'ACTIVE' ORDER BY "fullName" LIMIT 1`
  );
  return d;
}

/**
 * Bu dosyadaki testler doktor sahipliğini ve kongre defterini değiştiriyor.
 * Suite sırası bağımsız kalsın diye her testten sonra seed durumuna dönülür
 * (doctor-transfer.spec.ts ile aynı disiplin).
 */
const original: { doctorId: string; ownerSellerId: string | null }[] = [];

test.beforeAll(async () => {
  const rows = await query<{ id: string; ownerSellerId: string | null }>(
    `SELECT id, "ownerSellerId" FROM "Doctor"`
  );
  original.push(
    ...rows.map((r) => ({ doctorId: r.id, ownerSellerId: r.ownerSellerId }))
  );
});

test.afterEach(async () => {
  for (const o of original) {
    await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
      o.ownerSellerId,
      o.doctorId,
    ]);
  }
});

test("FR-49/FR-50: tahsilat kongre kazanımı doğurur, son kullanma +12 ay", async ({
  page,
}) => {
  const [order] = await query<{ doctorId: string }>(
    `SELECT "doctorId" FROM "Order" WHERE status <> 'CANCELLED' ORDER BY "dueDate" LIMIT 1`
  );

  await page.goto("/collections");
  await page.getByLabel("Doktor").selectOption(order.doctorId);
  await page.getByLabel("Tutar (₺)").fill("120");
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
  await expect(page.getByText(/Tahsilat kaydedildi/)).toBeVisible();

  const [earn] = await query<{
    amount: string;
    earnedAt: Date;
    expiresAt: Date;
  }>(
    `SELECT amount::text, "earnedAt", "expiresAt" FROM "CongressLedger"
      WHERE "doctorId" = $1 AND type = 'EARN'
      ORDER BY "createdAt" DESC LIMIT 1`,
    [order.doctorId]
  );
  expect(earn).toBeTruthy();

  // D-17: kazanım NET matrahtan doğar — 120 ₺ brüt (%20 KDV) → 100 ₺ net.
  expect(BigInt(earn.amount)).toBe(10000n);

  // FR-50: son kullanma tam 12 ay sonra.
  const months =
    (earn.expiresAt.getFullYear() - earn.earnedAt.getFullYear()) * 12 +
    (earn.expiresAt.getMonth() - earn.earnedAt.getMonth());
  expect(months).toBe(12);
});

test("🔴 FR-54/D-12: bakiye yetersizse kayıt SERT reddedilir, eksik tutar gösterilir", async ({
  browser,
}) => {
  const doctor = await pickDoctor();
  // Bakiyeyi sıfırla, sonra pahalı pakete kaydetmeyi dene.
  await query(
    `UPDATE "CongressLedger" SET "remainingAmount" = 0 WHERE "doctorId" = $1`,
    [doctor.id]
  );

  const ctx = await browser.newContext({
    storageState: "playwright/.auth/seller.json",
  });
  const page = await ctx.newPage();
  try {
    // Satıcının kendi doktoru olmalı; değilse sahipliği ona ver.
    const [seller] = await query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = 'ahmet@medikal.local'`
    );
    await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
      seller.id,
      doctor.id,
    ]);

    await page.goto("/my-congresses");
    await page.getByLabel("Doktor").selectOption(doctor.id);
    const pkgSelect = page.getByLabel("Kongre Paketi");
    // En pahalı paketi seç (Tam Paket 200.000 ₺).
    const options = await pkgSelect.locator("option").allTextContents();
    const expensive = options.findIndex((o) => o.includes("Tam Paket"));
    await pkgSelect.selectOption({ index: expensive });
    await page.getByRole("button", { name: "Kayıt Talebi Oluştur" }).click();

    await expect(page.getByText(/bakiyesi yetersiz/i)).toBeVisible();
    await expect(page.getByText(/Eksik tutar/i)).toBeVisible();
    await expect(page.getByText(/fark ödemesi yapılamaz/i)).toBeVisible();

    // Hiçbir kayıt oluşmamalı (RULE-07: kısmi harcama yok).
    const regs = await query(
      `SELECT id FROM "CongressRegistration" WHERE "doctorId" = $1`,
      [doctor.id]
    );
    expect(regs).toHaveLength(0);
  } finally {
    await ctx.close();
  }
});

test("🔴 RULE-09: aynı bakiye iki pakete AYNI ANDA harcanamaz (yarış testi)", async ({
  browser,
}) => {
  const doctor = await pickDoctor();
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = 'ahmet@medikal.local'`
  );
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    seller.id,
    doctor.id,
  ]);

  // Temiz durum: tüm bakiyeyi ve kayıtları sıfırla.
  await query(`DELETE FROM "CongressLedger" WHERE "doctorId" = $1`, [doctor.id]);
  await query(`DELETE FROM "CongressRegistration" WHERE "doctorId" = $1`, [
    doctor.id,
  ]);

  // TAM OLARAK bir "Katılım" paketine (50 ₺) yetecek bakiye ver.
  const [pkg] = await query<{ id: string; value: string }>(
    `SELECT id, value::text FROM "CongressPackage" WHERE name = 'Katılım' LIMIT 1`
  );
  await grantBalance(doctor.id, BigInt(pkg.value));
  expect(await balanceOf(doctor.id)).toBe(BigInt(pkg.value));

  // İki eşzamanlı talep — yalnızca BİRİ başarılı olmalı.
  const runOnce = async () => {
    const ctx = await browser.newContext({
      storageState: "playwright/.auth/seller.json",
    });
    const page = await ctx.newPage();
    try {
      await page.goto("/my-congresses");
      await page.getByLabel("Doktor").selectOption(doctor.id);
      const pkgSelect = page.getByLabel("Kongre Paketi");
      const options = await pkgSelect.locator("option").allTextContents();
      const idx = options.findIndex((o) => o.includes("Katılım"));
      await pkgSelect.selectOption({ index: idx });
      await page.getByRole("button", { name: "Kayıt Talebi Oluştur" }).click();
      await page.waitForTimeout(1500);
    } finally {
      await ctx.close();
    }
  };

  await Promise.all([runOnce(), runOnce()]);

  // 🔴 Bakiye ASLA negatife düşmemeli ve en fazla BİR aktif kayıt olmalı.
  const active = await query(
    `SELECT id FROM "CongressRegistration"
      WHERE "doctorId" = $1 AND status IN ('TALEP','ONAYLANDI')`,
    [doctor.id]
  );
  expect(active.length).toBeLessThanOrEqual(1);

  const balance = await balanceOf(doctor.id);
  expect(balance).toBeGreaterThanOrEqual(0n);
  // Bir kayıt olduysa bakiye tamamen tükenmiş olmalı.
  if (active.length === 1) expect(balance).toBe(0n);
});

test("🔴 FR-56: kayıt iptalinde bakiye iade edilir ama son kullanma UZAMAZ", async ({
  browser,
  page,
}) => {
  const doctor = await pickDoctor();
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = 'ahmet@medikal.local'`
  );
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    seller.id,
    doctor.id,
  ]);
  await query(`DELETE FROM "CongressLedger" WHERE "doctorId" = $1`, [doctor.id]);
  await query(`DELETE FROM "CongressRegistration" WHERE "doctorId" = $1`, [
    doctor.id,
  ]);

  // Kazanımı GEÇMİŞE tarihle: iade sonrası tarihin değişmediğini görelim.
  const earnedAt = new Date();
  earnedAt.setMonth(earnedAt.getMonth() - 3);
  const [pkg] = await query<{ id: string; value: string }>(
    `SELECT id, value::text FROM "CongressPackage" WHERE name = 'Katılım' LIMIT 1`
  );
  const lotId = await grantBalance(doctor.id, BigInt(pkg.value), earnedAt);

  const [lotBefore] = await query<{ expiresAt: Date }>(
    `SELECT "expiresAt" FROM "CongressLedger" WHERE id = $1`,
    [lotId]
  );

  // Satıcı talep açar → bakiye rezerve edilir.
  const ctx = await browser.newContext({
    storageState: "playwright/.auth/seller.json",
  });
  const sp = await ctx.newPage();
  try {
    await sp.goto("/my-congresses");
    await sp.getByLabel("Doktor").selectOption(doctor.id);
    const pkgSelect = sp.getByLabel("Kongre Paketi");
    const options = await pkgSelect.locator("option").allTextContents();
    await pkgSelect.selectOption({
      index: options.findIndex((o) => o.includes("Katılım")),
    });
    await sp.getByRole("button", { name: "Kayıt Talebi Oluştur" }).click();
    await expect(sp.getByText(/rezerve edildi/i)).toBeVisible();
  } finally {
    await ctx.close();
  }

  expect(await balanceOf(doctor.id)).toBe(0n); // rezerve edildi

  const [reg] = await query<{ id: string }>(
    `SELECT id FROM "CongressRegistration" WHERE "doctorId" = $1 AND status = 'TALEP'`,
    [doctor.id]
  );
  expect(reg).toBeTruthy();

  // Admin reddeder → iade.
  await page.goto("/congresses");
  await page.locator(`form[data-cancel="${reg.id}"] button`).click();

  // Başarı mesajı formun İÇİNDE; kayıt iptal olunca aksiyon bileşeni unmount
  // olduğu için mesaj da kaybolur. Gerçek kanıt kaydın durumudur.
  await expect
    .poll(async () => {
      const [r] = await query<{ status: string }>(
        `SELECT status FROM "CongressRegistration" WHERE id = $1`,
        [reg.id]
      );
      return r.status;
    })
    .toBe("REDDEDILDI");

  // Bakiye geri geldi.
  expect(await balanceOf(doctor.id)).toBe(BigInt(pkg.value));

  // 🔴 Son kullanma tarihi DEĞİŞMEDİ (iptalle süre kazanılamaz).
  const [lotAfter] = await query<{ expiresAt: Date; remainingAmount: string }>(
    `SELECT "expiresAt", "remainingAmount"::text FROM "CongressLedger" WHERE id = $1`,
    [lotId]
  );
  expect(lotAfter.expiresAt.toISOString()).toBe(lotBefore.expiresAt.toISOString());
  expect(BigInt(lotAfter.remainingAmount)).toBe(BigInt(pkg.value));
});

test("🔴 FR-51/RULE-11: harcama EN ESKİ kazanımdan düşer (FIFO)", async ({
  browser,
}) => {
  const doctor = await pickDoctor();
  const [seller] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = 'ahmet@medikal.local'`
  );
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    seller.id,
    doctor.id,
  ]);
  await query(`DELETE FROM "CongressLedger" WHERE "doctorId" = $1`, [doctor.id]);
  await query(`DELETE FROM "CongressRegistration" WHERE "doctorId" = $1`, [
    doctor.id,
  ]);

  const [pkg] = await query<{ value: string }>(
    `SELECT value::text FROM "CongressPackage" WHERE name = 'Katılım' LIMIT 1`
  );
  const price = BigInt(pkg.value);

  // İki lot: biri eski, biri yeni — her biri tam paket değeri kadar.
  const older = new Date();
  older.setMonth(older.getMonth() - 6);
  const oldLot = await grantBalance(doctor.id, price, older);
  const newLot = await grantBalance(doctor.id, price, new Date());

  const ctx = await browser.newContext({
    storageState: "playwright/.auth/seller.json",
  });
  const sp = await ctx.newPage();
  try {
    await sp.goto("/my-congresses");
    await sp.getByLabel("Doktor").selectOption(doctor.id);
    const pkgSelect = sp.getByLabel("Kongre Paketi");
    const options = await pkgSelect.locator("option").allTextContents();
    await pkgSelect.selectOption({
      index: options.findIndex((o) => o.includes("Katılım")),
    });
    await sp.getByRole("button", { name: "Kayıt Talebi Oluştur" }).click();
    await expect(sp.getByText(/rezerve edildi/i)).toBeVisible();
  } finally {
    await ctx.close();
  }

  const [oldAfter] = await query<{ remainingAmount: string }>(
    `SELECT "remainingAmount"::text FROM "CongressLedger" WHERE id = $1`,
    [oldLot]
  );
  const [newAfter] = await query<{ remainingAmount: string }>(
    `SELECT "remainingAmount"::text FROM "CongressLedger" WHERE id = $1`,
    [newLot]
  );

  // ESKİ lot tükendi, YENİ lot dokunulmadan durdu.
  expect(BigInt(oldAfter.remainingAmount)).toBe(0n);
  expect(BigInt(newAfter.remainingAmount)).toBe(price);
});
