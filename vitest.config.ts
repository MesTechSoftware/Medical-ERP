import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Sadece saf fonksiyon birim testleri. Playwright e2e'leri (e2e/**) hariç:
    // ikisi de .spec/.test kullandığı için include'u dar tutuyoruz.
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
