import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Faz A — doktor devri.
 *
 * FR-06 admin devredebilir + devir kaydı tutulur ·
 * FR-07 geçmiş siparişler ESKİ satıcıda kalır ·
 * FR-08 sahipsiz havuzdaki doktora sipariş girilemez ·
 * RULE-13 devir audit log'a yazılır ·
 * X-17-3 toplu devir · X-17-5 "Sahipsiz" süzgeci.
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
 * Toplu devir (X-17 §(4)): satırlardaki kutular `#sec-<doktorId>`, tek form `#toplu-devir`.
 * Boş satıcı seçimi sahipsiz havuz demektir.
 */
async function topluDevir(
  page: import("@playwright/test").Page,
  doctorIds: string[],
  sellerId: string,
  reason: string
) {
  for (const id of doctorIds) await page.locator(`#sec-${id}`).check();
  await page.locator("#toplu-satici").selectOption(sellerId);
  await page.locator("#toplu-gerekce").fill(reason);
  await page.locator("#toplu-devir").getByRole("button", { name: "Devret" }).click();
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
      WHERE role = 'SATICI' AND "isActive" AND id <> $1 LIMIT 1`,
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
  await topluDevir(page, [target.doctorId], newSeller.id, "E2E devir testi");
  await expect(page.getByText("Devir tamamlandı: 1 doktor.")).toBeVisible();

  // --- FR-06: sahiplik değişti + devir kaydı oluştu ---
  const [doctorAfter] = await query<{ ownerSellerId: string }>(
    `SELECT "ownerSellerId" FROM "Doctor" WHERE id = $1`,
    [target.doctorId]
  );
  expect(doctorAfter.ownerSellerId).toBe(newSeller.id);

  // İz olay kaydıdır: her geçiş bir satır, eski ve yeni sahip birlikte (X-17 §(3)).
  const assignments = await query<{ fromSellerId: string | null; toSellerId: string | null; reason: string }>(
    `SELECT "fromSellerId", "toSellerId", reason FROM "DoctorAssignment"
      WHERE "doctorId" = $1 ORDER BY "changedAt" ASC`,
    [target.doctorId]
  );
  expect(assignments.length).toBeGreaterThanOrEqual(2);
  expect(assignments.at(-1)).toEqual({
    fromSellerId: target.oldSellerId,
    toSellerId: newSeller.id,
    reason: "E2E devir testi",
  });

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

test("doktor sahipsiz havuza alınabilir; uyarı ve Sahipsiz süzgeci gösterir (FR-08, X-17-5)", async ({
  page,
}) => {
  const [doc] = await query<{ id: string; fullName: string; ownerSellerId: string }>(
    `SELECT id, "fullName", "ownerSellerId" FROM "Doctor"
      WHERE "ownerSellerId" IS NOT NULL LIMIT 1`
  );
  expect(doc).toBeTruthy();

  await page.goto("/doctors");
  // Boş seçim = sahipsiz havuz; gerekçe zorunlu (X-13, X-17).
  await topluDevir(page, [doc.id], "", "E2E sahipsiz bırakma");
  await expect(page.getByText("Devir tamamlandı: 1 doktor.")).toBeVisible();

  const [after] = await query<{ ownerSellerId: string | null }>(
    `SELECT "ownerSellerId" FROM "Doctor" WHERE id = $1`,
    [doc.id]
  );
  expect(after.ownerSellerId).toBeNull();

  // Admin ekranında sahipsiz uyarısı görünür.
  await page.reload();
  await expect(page.getByText(/sahipsiz havuzda/i)).toBeVisible();

  // "Sahipsiz" süzgeci yalnız sahipsiz doktorları listeler (X-17-5).
  const [owned] = await query<{ fullName: string }>(
    `SELECT "fullName" FROM "Doctor" WHERE "ownerSellerId" IS NOT NULL LIMIT 1`
  );
  await page.getByRole("navigation", { name: "Hızlı süzgeçler" }).getByRole("link", { name: "Sahipsiz", exact: true }).click();
  await expect(page).toHaveURL(/[?&]satici=yok/);
  await expect(page.getByRole("link", { name: new RegExp(doc.fullName) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(owned.fullName) })).toHaveCount(0);

  // Seed durumunu geri al (suite sırası bağımsızlığı).
  await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [
    doc.ownerSellerId,
    doc.id,
  ]);
});

test("toplu devir: iki doktor tek gerekçeyle, her birine iz satırı (X-17-3)", async ({ page }) => {
  const docs = await query<{ id: string; ownerSellerId: string }>(
    `SELECT id, "ownerSellerId" FROM "Doctor" WHERE "ownerSellerId" IS NOT NULL ORDER BY "fullName" LIMIT 2`
  );
  expect(docs).toHaveLength(2);
  const [hedef] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE role = 'SATICI' AND "isActive" AND id <> ALL($1) LIMIT 1`,
    [docs.map((d) => d.ownerSellerId)]
  );
  expect(hedef).toBeTruthy();

  await page.goto("/doctors");

  // Toplu devir çubuğu yalnız seçim varken görünür; gerekçesiz devir kaydedilmez.
  await expect(page.locator("#toplu-devir")).toBeHidden();
  await page.locator(`#sec-${docs[0].id}`).check();
  await expect(page.locator("#toplu-devir")).toBeVisible();
  await page.locator("#toplu-gerekce").fill("");
  await page.locator("#toplu-devir").getByRole("button", { name: "Devret" }).click();
  await expect(page.getByText("Gerekçe zorunludur.")).toBeVisible();
  await page.locator(`#sec-${docs[0].id}`).uncheck();

  await topluDevir(page, docs.map((d) => d.id), hedef.id, "E2E toplu devir");
  await expect(page.getByText("Devir tamamlandı: 2 doktor.")).toBeVisible();

  const izler = await query<{ doctorId: string; toSellerId: string }>(
    `SELECT "doctorId", "toSellerId" FROM "DoctorAssignment" WHERE reason = 'E2E toplu devir'`
  );
  expect(izler.map((i) => i.doctorId).sort()).toEqual(docs.map((d) => d.id).sort());
  expect(izler.every((i) => i.toSellerId === hedef.id)).toBe(true);

  // Seed durumunu geri al (suite sırası bağımsızlığı).
  for (const d of docs) {
    await query(`UPDATE "Doctor" SET "ownerSellerId" = $1 WHERE id = $2`, [d.ownerSellerId, d.id]);
  }
});
