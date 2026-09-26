import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

import { ITEST_DATABASE_URL } from "./test/integration/database-url";

const alias = { "@": resolve(__dirname, "./src") };

export default defineConfig({
  resolve: { alias },
  test: {
    // İki şerit ayrı koşar (F-00):
    //   unit        — saf fonksiyonlar, veritabanına dokunmaz, `npm test`
    //   integration — servis katmanı, medikal_itest'e karşı, `npm run test:integration`
    // Playwright e2e'leri (e2e/**) ikisinin de dışındadır.
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.itest.ts"],
          globalSetup: ["./test/integration/global-setup.ts"],
          setupFiles: ["./test/integration/setup.ts"],
          // Testler tek bir veritabanını paylaşır ve her testten önce TRUNCATE
          // atılır; paralel koşu birbirinin verisini siler. `singleFork` bütün
          // dosyaları tek süreçte sırayla koşturur — hız sorun değil.
          // (`fileParallelism` yalnız kök düzeyde geçerlidir, proje içinde değil.)
          poolOptions: { forks: { singleFork: true } },
          env: { DATABASE_URL: ITEST_DATABASE_URL },
        },
      },
    ],
  },
});
