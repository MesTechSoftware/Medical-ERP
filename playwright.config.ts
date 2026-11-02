import { defineConfig, devices } from "@playwright/test";

// E2E testleri, dev veritabanına dokunmamak için AYRI bir PostgreSQL
// veritabanına (medikal_test) karşı, dev'in 3000'inden ayrı bir portta (3100)
// çalışır. webServer her koşudan önce şemayı sıfırlar, seed'ler ve o env ile
// Next dev sunucusunu ayağa kaldırır.
//
// Yerel kurulum: `docker compose up -d` (medikal_test otomatik oluşturulur).
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_test?schema=public";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // CI'da ilerleme log'da görünsün (html yalnız sonda yazar); asılı kalan koşu 25 dakikada düşer (paket tek işçiyle 12–15 dk sürüyor).
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  globalTimeout: process.env.CI ? 25 * 60_000 : 0,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // Test veritabanını her koşuda sıfırdan kur: şemayı düşür + migrasyonları
  // uygula → seed → o env ile dev sunucusunu başlat.
  // NOT: Prisma 7'de `migrate reset` seed'i ARTIK kendisi çalıştırmıyor
  // (bu yüzden `--skip-seed` seçeneği de kaldırıldı) — seed açıkça çağrılmalı.
  webServer: {
    command: [
      `DATABASE_URL="${TEST_DATABASE_URL}" npx prisma migrate reset --force`,
      `DATABASE_URL="${TEST_DATABASE_URL}" npm run db:seed:demo`,
      `DATABASE_URL="${TEST_DATABASE_URL}" PORT=${PORT} npm run dev`,
    ].join(" && "),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "guest",
      testMatch: "guest/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin",
      testMatch: "admin/**/*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
    },
    {
      name: "seller",
      testMatch: "seller/**/*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/seller.json",
      },
    },
    {
      name: "operasyon",
      testMatch: "operasyon/**/*.spec.ts",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/operasyon.json",
      },
    },
    // Mobil web (ADR-009): kritik akışlar telefon, Android ve dokunmatik tablette de koşar.
    // Rol oturumunu spec dosyası seçer (`test.use({ storageState })`). iPhone/iPad WebKit'tir.
    {
      name: "mobil-iphone",
      testMatch: "mobil/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "mobil-android",
      testMatch: "mobil/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobil-ipad",
      testMatch: "mobil/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
});
