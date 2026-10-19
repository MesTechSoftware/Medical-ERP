import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { login, unique } from "../helpers";

/**
 * E-2-4 — CSRF regresyon testi (FAZ1 §D.4 madde 2). Uygulamada route handler yoktur; her yazma
 * server action'dır ve Next 16.2.10 server action'da Origin'i Host ile karşılaştırır. Bu test
 * o davranışı sabitler: `next.config.ts`'e geniş bir `allowedOrigins` girerse kırmızıya döner.
 *
 * Gözlenen eylem çıkıştır (etkisi DB'de görünür). Yeni bir satıcıyla ayrı bağlamda giriş
 * yapılır; paylaşılan oturumlar etkilenmez.
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

async function acikOturumSayisi(email: string): Promise<number> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT count(*)::int AS n FROM "Session" s JOIN "User" u ON u.id = s."userId"
       WHERE u.email = $1 AND s."revokedAt" IS NULL`,
      [email]
    );
    return rows[0].n;
  } finally {
    await client.end();
  }
}

test("başka origin'den gelen server action reddedilir ve etkisi olmaz (E-2-4)", async ({ page, browser }) => {
  const email = `${unique("csrf")}@test.local`;
  await page.goto("/sellers/new");
  await page.getByLabel("Ad Soyad").fill(unique("CSRF Satıcı"));
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre", { exact: true }).fill("test123");
  await page.getByRole("button", { name: "Satıcı Ekle" }).click();
  await expect(page).toHaveURL(/\/sellers$/);

  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const satici = await ctx.newPage();
  await login(satici, { email, password: "test123" });
  await expect(satici).toHaveURL(/\/my-orders/);
  expect(await acikOturumSayisi(email)).toBe(1);

  // Çıkış action'ının isteği yakalanır, Origin yabancı bir siteyle değiştirilir.
  let yanit = 0;
  await satici.route("**/*", async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      const res = await route.fetch({ headers: { ...req.headers(), origin: "https://evil.example" } });
      yanit = res.status();
      await route.fulfill({ response: res });
      return;
    }
    await route.continue();
  });
  await satici.getByRole("button", { name: "Çıkış" }).click();
  await expect.poll(() => yanit).not.toBe(0);

  expect(yanit).toBeGreaterThanOrEqual(400);
  expect(await acikOturumSayisi(email)).toBe(1);
  await satici.unroute("**/*");
  await satici.goto("/my-orders");
  await expect(satici).toHaveURL(/\/my-orders/);
  await ctx.close();
});
