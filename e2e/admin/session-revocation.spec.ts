import { test, expect, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { ilkGiris, yeniKullanici } from "../helpers";

/**
 * E-2-1 / E-2-3 — oturum veritabanındadır (ADR-003).
 *
 * Her test kendi satıcısını açar ve ayrı bir tarayıcı bağlamında giriş yapar: paylaşılan
 * storageState oturumları iptal edilmez, diğer suite'ler etkilenmez.
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

/** Yönetici ekranından doktorsuz yeni satıcı açar; id ve e-postasını döner. */
async function yeniSatici(admin: Page): Promise<{ id: string; email: string }> {
  const email = await yeniKullanici(admin, { prefix: "oturum" });
  const [u] = await query<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [email]);
  return { id: u.id, email };
}

async function saticiOturumu(browser: Browser, email: string) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await ilkGiris(page, email);
  await expect(page).toHaveURL(/\/my-orders/);
  return { ctx, page };
}

async function durumKaydet(admin: Page, id: string, durum: "AKTIF" | "PASIF") {
  await admin.goto(`/users/${id}/edit`);
  await admin.locator("#status").selectOption(durum);
  await admin.locator("#gerekce").fill("E2E durum değişikliği");
  await admin.getByRole("button", { name: "Kaydet" }).click();
  await expect(admin).toHaveURL(/\/users$/);
}

test("çerez opaktır: DB'de yalnız token'ın hash'i durur, çerez HttpOnly + SameSite=Lax (E-2-1)", async ({
  page,
  browser,
}) => {
  const { id, email } = await yeniSatici(page);
  const { ctx } = await saticiOturumu(browser, email);

  const cerezler = await ctx.cookies();
  expect(cerezler.map((c) => c.name)).toEqual(["oturum"]);
  const [cerez] = cerezler;
  expect(cerez.httpOnly).toBe(true);
  expect(cerez.sameSite).toBe("Lax");

  const oturumlar = await query<{ tokenHash: string }>(`SELECT "tokenHash" FROM "Session" WHERE "userId" = $1`, [id]);
  expect(oturumlar).toHaveLength(1);
  expect(oturumlar[0].tokenHash).not.toBe(cerez.value);
  expect(oturumlar[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
  await ctx.close();
});

test("pasifleştirme açık oturumu anında keser; yeniden aktifleştirme geri getirmez (E-2-3)", async ({
  page,
  browser,
}) => {
  const { id, email } = await yeniSatici(page);
  const satici = await saticiOturumu(browser, email);

  await durumKaydet(page, id, "PASIF");
  const iptal = await query(`SELECT id FROM "Session" WHERE "userId" = $1 AND "revokedAt" IS NULL`, [id]);
  expect(iptal).toHaveLength(0);

  await satici.page.goto("/my-orders");
  await expect(satici.page).toHaveURL(/\/login/);

  // Aynı çerezle, kullanıcı yeniden aktifken de oturum dönmez.
  await durumKaydet(page, id, "AKTIF");
  await satici.page.goto("/my-orders");
  await expect(satici.page).toHaveURL(/\/login/);
  await satici.ctx.close();
});

test("rol her istekte DB'den okunur (E-2-1)", async ({ page, browser }) => {
  const { id, email } = await yeniSatici(page);
  const satici = await saticiOturumu(browser, email);

  // Rol değişikliği ekranı Faz 1'de yoktur (X-17-4); değişiklik DB'den yapılır.
  await query(`UPDATE "User" SET role = 'OPERASYON' WHERE id = $1`, [id]);
  await satici.page.goto("/my-orders");
  await expect(satici.page).toHaveURL(/\/dashboard/);
  await satici.ctx.close();
});

test("çıkış oturumu iptal eder; aynı çerez bir daha geçmez (E-2-3)", async ({ page, browser }) => {
  const { id, email } = await yeniSatici(page);
  const satici = await saticiOturumu(browser, email);
  const [cerez] = await satici.ctx.cookies();

  await satici.page.getByRole("button", { name: "Çıkış" }).click();
  await expect(satici.page).toHaveURL(/\/login/);
  const [o] = await query<{ revokedAt: Date | null }>(`SELECT "revokedAt" FROM "Session" WHERE "userId" = $1`, [id]);
  expect(o.revokedAt).not.toBeNull();

  // Çerez geri konsa da oturum dönmez.
  await satici.ctx.addCookies([cerez]);
  await satici.page.goto("/my-orders");
  await expect(satici.page).toHaveURL(/\/login/);
  await satici.ctx.close();
});
