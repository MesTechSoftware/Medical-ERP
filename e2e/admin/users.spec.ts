import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { GECICI_PAROLA, USERS, ilkGiris, login, unique, yeniKullanici } from "../helpers";

/**
 * E-2-5 / E-2-8 / E-2-9 — Kullanıcılar ekranı (E-2 20.10.2026 eki). Yeni hesaplar her testte
 * ayrı açılır; paylaşılan seed hesapları değiştirilmez.
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

const idOf = async (email: string) =>
  (await query<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [email]))[0].id;

test("yönetici rol seçerek hesap açar; parola geçicidir, gerekçe denetim kaydına yazılır (E-2-5)", async ({
  page,
}) => {
  const email = await yeniKullanici(page, { role: "OPERASYON" });

  const satir = page.getByRole("row").filter({ hasText: email });
  await expect(satir.getByRole("cell", { name: "Operasyon", exact: true })).toBeVisible();
  // Silme yolu yoktur (E-2 §(6)).
  await expect(page.getByRole("button", { name: "Sil" })).toHaveCount(0);

  const id = await idOf(email);
  const [u] = await query<{ role: string; mustChangePassword: boolean }>(
    `SELECT role, "mustChangePassword" FROM "User" WHERE id = $1`,
    [id]
  );
  expect(u).toEqual({ role: "OPERASYON", mustChangePassword: true });
  // X-18-5: gerekçe kaydın kendi alanında. X-18-3: gerçek istekte bağlam dolu — IP, yöneticinin açık
  // oturumu, server action yöntemi ve formun sayfa yolu; kayıt mühürlü.
  const [log] = await query<{
    reason: string;
    ipAddress: string | null;
    requestMethod: string | null;
    endpoint: string | null;
    actorRole: string | null;
    oturumVar: boolean;
    muhurlu: boolean;
  }>(
    `SELECT a."reason", a."ipAddress", a."requestMethod", a."endpoint", a."actorRole",
            EXISTS (SELECT 1 FROM "Session" s WHERE s."id" = a."sessionId" AND s."userId" = a."actorId") AS "oturumVar",
            EXISTS (SELECT 1 FROM "AuditLogSeal" m WHERE m."logId" = a."id") AS "muhurlu"
     FROM "AuditLog" a WHERE a.action = 'USER_CREATE' AND a."entityId" = $1`,
    [id]
  );
  expect(log).toMatchObject({ reason: "E2E hesap açılışı", requestMethod: "POST", actorRole: "YONETICI", oturumVar: true, muhurlu: true });
  expect(log.ipAddress).toMatch(/^[0-9a-f:.]+$/i);
  expect(log.endpoint).toMatch(/^\/users/);

  // Rol düzenleme formunda alan değildir.
  await page.goto(`/users/${id}/edit`);
  await expect(page.getByLabel("Rol", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Rol: Operasyon")).toBeVisible();
});

test("gerekçesiz ya da politikaya uymayan parolayla hesap açılmaz (E-2-5, E-2-6)", async ({ page }) => {
  const email = `${unique("red")}@test.local`;
  await page.goto("/users/new");
  await page.getByLabel("Ad Soyad").fill("Red Testi");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Geçici Parola").fill("password");
  await page.getByLabel("Gerekçe").fill("E2E");
  await page.getByRole("button", { name: "Kullanıcı Ekle" }).click();
  await expect(page.getByText(/çok yaygın/)).toBeVisible();

  // Gerekçe alanı HTML'de zorunludur; sunucu kontrolü için boşlukla gönderilir.
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Ad Soyad").fill("Red Testi");
  await page.getByLabel("Geçici Parola").fill(GECICI_PAROLA);
  await page.getByLabel("Gerekçe").fill("   ");
  await page.getByRole("button", { name: "Kullanıcı Ekle" }).click();
  await expect(page.getByText("Gerekçe zorunludur.")).toBeVisible();

  expect(await query(`SELECT id FROM "User" WHERE email = $1`, [email])).toHaveLength(0);
});

test("yönetici kendi hesabını pasifleştiremez (E-2-9)", async ({ page }) => {
  const id = await idOf(USERS.admin.email);
  await page.goto(`/users/${id}/edit`);
  await page.locator("#status").selectOption("PASIF");
  await page.locator("#gerekce").fill("E2E");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kendi hesabınızı pasifleştiremezsiniz.")).toBeVisible();
  const [u] = await query<{ isActive: boolean }>(`SELECT "isActive" FROM "User" WHERE id = $1`, [id]);
  expect(u.isActive).toBe(true);
});

test("parola sıfırlama açık oturumları kapatır ve değişimi yeniden zorunlu kılar (E-2-8)", async ({
  page,
  browser,
}) => {
  const email = await yeniKullanici(page);
  const id = await idOf(email);
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const kullanici = await ctx.newPage();
  await ilkGiris(kullanici, email);
  await expect(kullanici).toHaveURL(/\/my-orders/);
  // X-18-3: giriş kaydı, aynı transaction'da açılan oturumun numarasını ve giriş sayfasını taşır.
  const [giris] = await query<{ oturumVar: boolean; endpoint: string | null }>(
    `SELECT EXISTS (SELECT 1 FROM "Session" s WHERE s."id" = a."sessionId" AND s."userId" = $1) AS "oturumVar", a."endpoint"
     FROM "AuditLog" a WHERE a.action = 'AUTH_LOGIN_SUCCESS' AND a."actorId" = $1 ORDER BY a."seq" LIMIT 1`,
    [id]
  );
  expect(giris).toEqual({ oturumVar: true, endpoint: "/login" });

  // Gerekçesiz sıfırlama kaydedilmez.
  await page.goto(`/users/${id}/edit`);
  await page.getByLabel(/Geçici Parola Ata/).fill("baska-gecici-3");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Gerekçe zorunludur.")).toBeVisible();

  await page.getByLabel(/Geçici Parola Ata/).fill("baska-gecici-3");
  await page.locator("#gerekce").fill("Parolasını unuttu");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/users$/);

  const acik = await query(`SELECT id FROM "Session" WHERE "userId" = $1 AND "revokedAt" IS NULL`, [id]);
  expect(acik).toHaveLength(0);
  await kullanici.goto("/my-orders");
  await expect(kullanici).toHaveURL(/\/login/);

  await login(kullanici, { email, password: "baska-gecici-3" });
  await expect(kullanici).toHaveURL(/\/parola-degistir$/);
  await ctx.close();
});
