import { type Page, expect } from "@playwright/test";

// Seed'lenen sabit kullanıcılar (prisma/seed.ts ile birebir).
export const USERS = {
  admin: { email: "admin@medikal.local", password: "admin123" },
  seller: { email: "ahmet@medikal.local", password: "satici123" },
  operasyon: { email: "operasyon@medikal.local", password: "operasyon123" },
} as const;

// Seed'lenen satıcı adları (cari/ödeme testleri için).
export const SEED_SELLER_NAME = "Ahmet Yılmaz";

/** Aynı test.db bir koşu boyunca paylaşıldığı için mutasyon testleri
 *  benzersiz veri kullanır; böylece retry/tekrarda çakışma olmaz. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
}

/** Login formunu doldurup gönderir ve yönlenmeyi bekler. */
export async function login(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(user.email);
  await page.getByLabel("Şifre").fill(user.password);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Politikaya uyan iki parola (E-2-6): yöneticinin verdiği geçici parola ve kullanıcının yenisi. */
export const GECICI_PAROLA = "gecici-parola-1";
export const YENI_PAROLA = "kalici-parola-2";

/**
 * Yönetici ekranından yeni hesap açar (E-2-5); e-postasını döner. Parola geçicidir —
 * kullanıcı ilk girişte değiştirir (`ilkGiris`).
 */
export async function yeniKullanici(
  admin: Page,
  opts: { role?: "SATICI" | "OPERASYON" | "YONETICI"; prefix?: string } = {}
): Promise<string> {
  const email = `${unique(opts.prefix ?? "kullanici")}@test.local`;
  await admin.goto("/users/new");
  await admin.getByLabel("Ad Soyad").fill(unique("E2E Kullanıcı"));
  await admin.getByLabel("E-posta").fill(email);
  await admin.getByLabel("Rol", { exact: true }).selectOption(opts.role ?? "SATICI");
  await admin.getByLabel("Geçici Parola").fill(GECICI_PAROLA);
  await admin.getByLabel("Gerekçe").fill("E2E hesap açılışı");
  await admin.getByRole("button", { name: "Kullanıcı Ekle" }).click();
  await expect(admin).toHaveURL(/\/users$/);
  return email;
}

/** Geçici parolayla girer, zorunlu parola değişimini tamamlar (E-2-7). */
export async function ilkGiris(page: Page, email: string, gecici = GECICI_PAROLA, yeni = YENI_PAROLA) {
  await login(page, { email, password: gecici });
  await expect(page).toHaveURL(/\/parola-degistir$/);
  await page.getByLabel("Mevcut (geçici) parola").fill(gecici);
  await page.getByLabel("Yeni parola", { exact: true }).fill(yeni);
  await page.getByLabel("Yeni parola (tekrar)").fill(yeni);
  await page.getByRole("button", { name: "Parolayı Değiştir" }).click();
  await expect(page).not.toHaveURL(/\/parola-degistir/);
}

const TEST_DB =
  process.env.TEST_DATABASE_URL ?? "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

/** Test veritabanında tek sorgu (medikal_test). */
export async function sorgu<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: TEST_DB });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

/**
 * Stoğu hiç olmayan yeni ürünle `HAZIRLANIYOR` sipariş (2 adet) — sevkiyatı negatif stok
 * onayına düşer (A-8). Doktor ve ürün benzersizdir; başka testin stoğuna dokunmaz.
 * `stoklu` verilirse yeni ürüne 10 adet giriş yazılır (sevkiyat onaysız geçer).
 */
export async function stoksuzSiparis({ stoklu = false } = {}) {
  const ek = `${Date.now() % 100000}`.padStart(5, "0") + `${Math.floor(Math.random() * 100)}`.padStart(2, "0");
  const doktorAdi = `Dr. Onay ${ek}`;
  const urunAdi = `Stoksuz Ürün ${ek}`;
  const [{ id: doktorId }] = await sorgu<{ id: string }>(
    `INSERT INTO "Doctor" (id, "accountClass", "fullName", clinic, region, "phoneNormalized", "partyType", status)
     VALUES ($1, 'DOKTOR', $2, 'Klinik', 'Bölge', $3, 'TUZEL_KISI', 'AKTIF') RETURNING id`,
    [`e2e-dr-${ek}`, doktorAdi, `+90538${ek}`]
  );
  await sorgu(
    `INSERT INTO "Product" (id, name, code, "taxRateId") SELECT $1, $2, $3, "taxRateId" FROM "Product" LIMIT 1`,
    [`e2e-urun-${ek}`, urunAdi, `E2E-${ek}`]
  );
  if (stoklu) {
    await sorgu(
      `INSERT INTO "StockMovement" (id, "productId", "locationId", type, quantity)
       SELECT $1, $2, id, 'GIRIS', 10 FROM "StockLocation" WHERE type = 'DEPO' ORDER BY "sortOrder" LIMIT 1`,
      [`e2e-stok-${ek}`, `e2e-urun-${ek}`]
    );
  }
  const siparisId = `e2e-sip-${ek}`;
  const kalemId = `e2e-kal-${ek}`;
  const documentNo = `E2E-SIP-${ek}`;
  await sorgu(
    `INSERT INTO "Order" (id, "documentNo", "doctorId", stage, status, "paymentTermDays", "updatedAt")
     VALUES ($1, $2, $3, 'ONAYLI', 'HAZIRLANIYOR', 30, now())`,
    [siparisId, documentNo, doktorId]
  );
  await sorgu(
    `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "listPrice", "unitPrice", "vatRate")
     VALUES ($1, $2, $3, 2, 100, 100, 20)`,
    [kalemId, siparisId, `e2e-urun-${ek}`]
  );
  return { doktorAdi, urunAdi, siparisId, kalemId, documentNo };
}
