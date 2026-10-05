import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { USERS } from "../helpers";

const connectionString =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

test.describe("Girişsiz erişim ve login", () => {
  test("yanlış şifre hata mesajı gösterir", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-posta").fill(USERS.admin.email);
    await page.getByLabel("Şifre").fill("yanlis-sifre");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(
      page.getByText("E-posta veya şifre hatalı.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("girişsiz korumalı sayfa /login'e yönlendirir", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("kök yol girişsiz /login'e yönlendirir", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  // Bayi bir cari tipidir, kullanıcı değildir (X-8): CM'de DEALER rolü enum'dan çıktı.
  // OPERASYON şemada vardır ama davranışı 1B madde 3'te doğar (GÇ-7) — o güne kadar giremez.
  test("OPERASYON rolü 1B'ye kadar giriş yapamaz (GÇ-7)", async ({ page }) => {
    const email = "e2e-operasyon@medikal.local";
    const client = new Client({ connectionString });
    await client.connect();
    try {
      await client.query(
        `INSERT INTO "User" (id, name, email, "passwordHash", role, "isActive")
         VALUES (gen_random_uuid()::text, 'E2E Operasyon', $1, $2, 'OPERASYON', true)
         ON CONFLICT (email) DO NOTHING`,
        [email, await bcrypt.hash("operasyon123", 10)]
      );
    } finally {
      await client.end();
    }

    await page.goto("/login");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Şifre").fill("operasyon123");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
