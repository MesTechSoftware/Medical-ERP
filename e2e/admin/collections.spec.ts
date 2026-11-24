import { test, expect } from "@playwright/test";
import { Client } from "pg";

/**
 * Tahsilat ekranı.
 *
 * FR-29 iptal ters kayıt · geçersiz tutar reddi. FIFO mahsup ve yaşlandırma C3'te
 * söküldü (GÇ-3, X-6). Bakiyenin tahsilatla düşmesi (FR-20, FR-25) cari hareketten
 * okunur ve hareketi yazan akış 1B madde 2'dedir: CM → 1B arası bakiye boştur
 * (FAZ1 R-11) — bu iki bakiye testi 1B'ye taşındı.
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
  const [row] = await query<{ id: string }>(
    `SELECT id FROM "Doctor" ORDER BY "fullName" LIMIT 1`
  );
  return row;
}

async function havaleId() {
  const [row] = await query<{ id: string }>(
    `SELECT id FROM "PaymentMethod" WHERE type = 'BANKA' LIMIT 1`
  );
  return row.id;
}

async function paymentCount(doctorId: string) {
  const [row] = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM "DoctorPayment" WHERE "doctorId" = $1`,
    [doctorId]
  );
  return Number.parseInt(row.n, 10);
}

test("🔴 tahsilat kaydedilir ve iptal edilir — kayıt silinmez (FR-29)", async ({
  page,
}) => {
  const doctor = await pickDoctor();

  await page.goto("/collections/new");
  await page.getByLabel("Cari").selectOption(doctor.id);
  await page.getByLabel("Tutar — KDV dahil (₺)").fill("50,25");
  await page.getByLabel("Yöntem").selectOption(await havaleId());
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();
  await expect(page.getByText(/Tahsilat kaydedildi/)).toBeVisible();

  // Az önce oluşturulan tahsilatı KESİN olarak hedefle (eşit zaman damgalarında sıra belirsiz).
  const [created] = await query<{ id: string; documentNo: string }>(
    `SELECT id, "documentNo" FROM "DoctorPayment"
      WHERE "doctorId" = $1 AND amount = 50.25 AND status = 'AKTIF'
      ORDER BY "createdAt" DESC LIMIT 1`,
    [doctor.id]
  );
  expect(created).toBeTruthy();
  expect(created.documentNo).toMatch(/^THS-\d{4}-\d{6}$/); // A-14

  // İptal tahsilat panelinden, gerekçeyle (Ü-26 §3.5, X-18-5).
  page.on("dialog", (d) => d.accept());
  await page.goto(`/collections?detay=${created.id}`);
  const form = page.getByRole("dialog").locator(`form[data-payment-id="${created.id}"]`);
  await form.getByLabel("Gerekçe").fill("Dekont hatalı");
  await form.getByRole("button", { name: "Tahsilatı iptal et" }).click();

  // Durumu VERİTABANINDAN doğrula.
  await expect
    .poll(async () => {
      const [row] = await query<{ status: string; cancelReason: string | null }>(
        `SELECT status, "cancelReason" FROM "DoctorPayment" WHERE id = $1`,
        [created.id]
      );
      return row;
    })
    .toEqual({ status: "IPTAL", cancelReason: "Dekont hatalı" });
});

test("geçersiz tutar sunucuda reddedilir", async ({ page }) => {
  const doctor = await pickDoctor();
  const before = await paymentCount(doctor.id);

  await page.goto("/collections/new");
  await page.getByLabel("Cari").selectOption(doctor.id);
  await page.getByLabel("Tutar — KDV dahil (₺)").fill("0");
  await page.getByLabel("Yöntem").selectOption(await havaleId());
  await page.getByRole("button", { name: "Tahsilat Kaydet" }).click();

  await expect(page.getByText("Geçerli bir tutar giriniz.")).toBeVisible();
  expect(await paymentCount(doctor.id)).toBe(before); // hiçbir şey yazılmadı
});
