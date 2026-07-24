import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz A — doktor devri.
 *
 * FR-06 admin devredebilir + devir kaydı tutulur ·
 * FR-07 geçmiş siparişler ESKİ satıcıda kalır ·
 * FR-08 sahipsiz havuzdaki doktora sipariş girilemez ·
 * RULE-13 devir audit log'a yazılır.
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

/**
 * Devir formu doktor adıyla AYNI satırda değil (ad bir <tr>, form alttaki <tr>).
 * TransferForm doktor id'siyle benzersiz alan id'leri ürettiği için onları
 * kullanmak hem kesin hem kırılgan olmayan bir çapa sağlıyor.
 */
function transferForm(page: import("@playwright/test").Page, doctorId: string) {
  const select = page.locator(`#seller-${doctorId}`);
  return {
    select,
    reason: page.locator(`#reason-${doctorId}`),
    submit: page
      .locator("form")
      .filter({ has: select })
      .getByRole("button", { name: "Devret" }),
  };
}

test("admin doktoru devreder; geçmiş siparişler eski satıcıda kalır (FR-06/FR-07)", async ({
  page,
}) => {
  // Siparişi OLAN bir doktor seç (FR-07'yi anlamlı test etmek için).
  const [target] = await query<{
    doctorId: string;
    fullName: string;
    oldSellerId: string;
    oldSellerName: string;
    orderCount: string;
  }>(
    `SELECT d.id AS "doctorId", d."fullName", u.id AS "oldSellerId",
            u.name AS "oldSellerName", count(o.id)::text AS "orderCount"
       FROM "Doctor" d
       JOIN "User" u ON u.id = d."ownerSellerId"
       JOIN "Order" o ON o."doctorId" = d.id
      GROUP BY d.id, d."fullName", u.id, u.name
      HAVING count(o.id) > 0
      LIMIT 1`
  );
  expect(target, "siparişi olan bir doktor bulunamadı").toBeTruthy();

  // Devredilecek FARKLI bir aktif satıcı.
  const [newSeller] = await query<{ id: string; name: string }>(
    `SELECT id, name FROM "User"
      WHERE role = 'SELLER' AND status = 'ACTIVE' AND id <> $1 LIMIT 1`,
    [target.oldSellerId]
  );
  expect(newSeller).toBeTruthy();

  // Devir öncesi sipariş sahipliği anlık görüntüsü.
  const ordersBefore = await query<{ sellerId: string }>(
    `SELECT "sellerId" FROM "Order" WHERE "doctorId" = $1`,
    [target.doctorId]
  );
  expect(ordersBefore.length).toBeGreaterThan(0);
  expect(ordersBefore.every((o) => o.sellerId === target.oldSellerId)).toBe(true);

  // --- Devri arayüzden yap ---
  await page.goto("/doctors");
  const form = transferForm(page, target.doctorId);
  await form.select.selectOption(newSeller.id);
  await form.reason.fill("E2E devir testi");
  await form.submit.click();
  await expect(page.getByText("Devir tamamlandı.")).toBeVisible();

  // --- FR-06: sahiplik değişti + devir kaydı oluştu ---
  const [doctorAfter] = await query<{ ownerSellerId: string }>(
    `SELECT "ownerSellerId" FROM "Doctor" WHERE id = $1`,
    [target.doctorId]
  );
  expect(doctorAfter.ownerSellerId).toBe(newSeller.id);

  const assignments = await query<{ sellerId: string; toDate: Date | null }>(
    `SELECT "sellerId", "toDate" FROM "DoctorAssignment"
      WHERE "doctorId" = $1 ORDER BY "fromDate" ASC`,
    [target.doctorId]
  );
  // Eski atama kapandı, yeni atama açık.
  expect(assignments.length).toBeGreaterThanOrEqual(2);
  expect(assignments.at(-1)!.sellerId).toBe(newSeller.id);
  expect(assignments.at(-1)!.toDate).toBeNull();
  expect(assignments.at(-2)!.toDate).not.toBeNull();

  // --- 🔴 FR-07: geçmiş siparişler ESKİ satıcıda kaldı ---
  const ordersAfter = await query<{ sellerId: string }>(
    `SELECT "sellerId" FROM "Order" WHERE "doctorId" = $1`,
    [target.doctorId]
  );
  expect(ordersAfter).toHaveLength(ordersBefore.length);
  expect(ordersAfter.every((o) => o.sellerId === target.oldSellerId)).toBe(true);

  // --- RULE-13: audit kaydı yazıldı ---
  const audit = await query(
    `SELECT id FROM "AuditLog"
      WHERE action = 'DOCTOR_TRANSFER' AND "entityId" = $1`,
    [target.doctorId]
  );
  expect(audit.length).toBeGreaterThan(0);

  // Seed durumunu geri al: suite sırası bağımsız kalsın (diğer testler
  // seed'deki sahiplik dağılımına güveniyor).
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    target.oldSellerId,
    target.doctorId,
  ]);
});

test("doktor sahipsiz havuza alınabilir ve uyarı gösterilir (FR-08)", async ({
  page,
}) => {
  const [doc] = await query<{ id: string; fullName: string; ownerSellerId: string }>(
    `SELECT id, "fullName", "ownerSellerId" FROM "Doctor"
      WHERE "ownerSellerId" IS NOT NULL LIMIT 1`
  );
  expect(doc).toBeTruthy();

  await page.goto("/doctors");
  const form = transferForm(page, doc.id);
  await form.select.selectOption(""); // — Sahipsiz havuz —
  await form.submit.click();
  await expect(page.getByText("Devir tamamlandı.")).toBeVisible();

  const [after] = await query<{ ownerSellerId: string | null }>(
    `SELECT "ownerSellerId" FROM "Doctor" WHERE id = $1`,
    [doc.id]
  );
  expect(after.ownerSellerId).toBeNull();

  // Admin ekranında sahipsiz uyarısı görünür.
  await page.reload();
  await expect(page.getByText(/sahipsiz havuzda/i)).toBeVisible();

  // Seed durumunu geri al (suite sırası bağımsızlığı).
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    doc.ownerSellerId,
    doc.id,
  ]);
});
