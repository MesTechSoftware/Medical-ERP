import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { USERS, aramaliSec, unique } from "../helpers";

/**
 * Faz A — doktor varlığı, sahiplik ve mükerrer kayıt engeli.
 *
 * FR-03 sahiplik otomatik atanır · FR-09 telefon benzersiz ·
 * FR-04/RULE-02 sahibi olmayan satıcı sipariş açamaz (SUNUCU tarafı).
 */

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows as T[];
  } finally {
    await client.end();
  }
}

/** Benzersiz, geçerli bir TR cep numarası üretir. */
function uniquePhone(): string {
  const n = String(Date.now()).slice(-7) + String(Math.floor(Math.random() * 10));
  return `05${n.slice(0, 9)}`.slice(0, 11).padEnd(11, "0");
}

async function addDoctor(
  page: import("@playwright/test").Page,
  name: string,
  phone: string
) {
  await page.goto("/my-doctors/new");
  await page.getByLabel("Ad Soyad").fill(name);
  await page.getByLabel("Klinik / Kurum").fill("Test Kliniği");
  await page.getByLabel("Bölge").fill("Marmara");
  await page.getByLabel("Telefon").fill(phone);
  await page.getByRole("button", { name: "Doktor Ekle" }).click();
}

test("satıcı doktor ekler, sahiplik otomatik kendisine atanır (FR-03)", async ({
  page,
}) => {
  const name = unique("Dr Sahiplik");
  const phone = uniquePhone();

  await addDoctor(page, name, phone);

  await expect(page).toHaveURL(/\/my-doctors$/);
  await expect(page.getByText(name)).toBeVisible();

  // Sahiplik gerçekten satıcıya yazıldı mı?
  const rows = await query<{ email: string }>(
    `SELECT u.email FROM "Doctor" d JOIN "User" u ON u.id = d."ownerSellerId"
     WHERE d."fullName" = $1`,
    [name]
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].email).toBe(USERS.seller.email);
});

test("🔴 aynı telefonla ikinci doktor kaydı açılamaz — farklı yazımla bile (FR-09)", async ({
  page,
}) => {
  const phone = uniquePhone();
  await addDoctor(page, unique("Dr Ilk"), phone);
  await expect(page).toHaveURL(/\/my-doctors$/);

  // Aynı numara, FARKLI yazım: normalize edilmezse mükerrer kayıt oluşurdu.
  const spaced = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 9)} ${phone.slice(9)}`;
  await addDoctor(page, unique("Dr Ikinci"), spaced);

  // Kayıt reddedilmeli: formda kalıp hata göstermeli.
  await expect(page).toHaveURL(/\/my-doctors\/new/);
  await expect(page.getByText(/zaten.*kayıtlı/i)).toBeVisible();

  // Veritabanında tek kayıt olmalı.
  const rows = await query(
    `SELECT id FROM "Doctor" WHERE "phoneNormalized" = $1`,
    [`+90${phone.slice(1)}`]
  );
  expect(rows).toHaveLength(1);
});

test("satıcı başka satıcının doktorunu listesinde görmez (FR-05)", async ({
  page,
}) => {
  // Sabit seed adlarına GÜVENME: devir testleri sahipliği değiştirebiliyor.
  // Sahiplik dağılımını çalışma anında veritabanından oku.
  const [mine] = await query<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d JOIN "User" u ON u.id = d."ownerSellerId"
      WHERE u.email = $1 LIMIT 1`,
    [USERS.seller.email]
  );
  const [foreign] = await query<{ fullName: string }>(
    `SELECT d."fullName" FROM "Doctor" d JOIN "User" u ON u.id = d."ownerSellerId"
      WHERE u.email <> $1 LIMIT 1`,
    [USERS.seller.email]
  );
  expect(mine, "oturumdaki satıcının doktoru yok").toBeTruthy();
  expect(foreign, "başka satıcının doktoru yok").toBeTruthy();

  await page.goto("/my-doctors?per=100");
  await expect(page.getByText(mine.fullName).first()).toBeVisible();
  await expect(page.getByText(foreign.fullName)).toHaveCount(0);
});

test("listedeki 'Düzenle' linki doktorun edit sayfasını açar (404 vermez)", async ({
  page,
}) => {
  const name = unique("Dr Duzenle");
  await addDoctor(page, name, uniquePhone());
  await expect(page).toHaveURL(/\/my-doctors$/);

  // Regresyon: link yanlışlıkla admin rotasına (/doctors/:id/edit) işaret ederse
  // satıcı erişemez ve 404 döner. Satıcının kendi rotasına gitmeli.
  await page
    .locator("tr", { hasText: name })
    .getByRole("link", { name: "Düzenle" })
    .click();

  await expect(page).toHaveURL(/\/my-doctors\/[^/]+\/edit$/);
  // Edit formu doktorun verisiyle yüklendi (404 değil, doğru kayıt).
  await expect(page.getByLabel("Ad Soyad")).toHaveValue(name);
});

test("🔴 sahibi olmayan doktora sipariş SUNUCUDA reddedilir (FR-04/RULE-02)", async ({
  page,
}) => {
  // Başka satıcıya ait doktorun gerçek id'sini al.
  const rows = await query<{ id: string }>(
    `SELECT d.id FROM "Doctor" d JOIN "User" u ON u.id = d."ownerSellerId"
     WHERE u.email <> $1 LIMIT 1`,
    [USERS.seller.email]
  );
  expect(rows).toHaveLength(1);
  const foreignDoctorId = rows[0].id;

  await page.goto("/my-orders/new");
  await aramaliSec(page, "Ürün");

  // Arayüzde bu doktor listelenmiyor; gizli alana yazılarak ham istek taklit edilir.
  await page.evaluate((id) => {
    const alan = document.querySelector<HTMLInputElement>('input[name="doctorId"]');
    if (!alan) throw new Error("doctorId alanı bulunamadı");
    alan.value = id;
  }, foreignDoctorId);

  await page.getByRole("button", { name: "Siparişi Oluştur" }).click();

  await expect(page.getByText(/portföyünüzde değil/i)).toBeVisible();
  await expect(page).toHaveURL(/\/my-orders\/new/);

  // Sipariş gerçekten oluşmamalı.
  const orders = await query(
    `SELECT o.id FROM "Order" o JOIN "User" u ON u.id = o."sellerId"
     WHERE o."doctorId" = $1 AND u.email = $2`,
    [foreignDoctorId, USERS.seller.email]
  );
  expect(orders).toHaveLength(0);
});
