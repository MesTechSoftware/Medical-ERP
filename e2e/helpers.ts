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
