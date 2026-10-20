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
