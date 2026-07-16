import { defineConfig, devices } from "@playwright/test";

// E2E testleri, gerçek dev.db'ye dokunmamak için AYRI bir test.db'ye karşı,
// dev'in 3000'inden ayrı bir portta (3100) çalışır. webServer her koşudan önce
// test.db'yi seed'ler ve o env ile Next dev sunucusunu ayağa kaldırır.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // test.db'yi her koşuda sıfırdan kur: dosyayı sil → migrasyonları uygula
  // (forward-only, yıkıcı reset yok) → seed → o env ile dev sunucusunu başlat.
  webServer: {
    command: [
      "rm -f test.db test.db-journal",
      'DATABASE_URL="file:./test.db" npx prisma migrate deploy',
      'DATABASE_URL="file:./test.db" npm run db:seed',
      `DATABASE_URL="file:./test.db" PORT=${PORT} npm run dev`,
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
  ],
});
