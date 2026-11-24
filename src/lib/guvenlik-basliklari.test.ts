import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

// Ü-39-1 · ÜG-1: temel güvenlik başlıkları her yola konur; CSP Faz 2'dir (bilinçli yok).
describe("güvenlik başlıkları (Ü-39-1)", () => {
  it("bütün yollarda nosniff, çerçeveleme engeli, referrer politikası ve HSTS vardır; CSP yoktur", async () => {
    const kurallar = await nextConfig.headers!();
    expect(kurallar).toHaveLength(1);
    expect(kurallar[0].source).toBe("/:path*");
    const basliklar = Object.fromEntries(kurallar[0].headers.map((h) => [h.key.toLowerCase(), h.value]));
    expect(basliklar["x-content-type-options"]).toBe("nosniff");
    expect(basliklar["x-frame-options"]).toBe("DENY");
    expect(basliklar["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(basliklar["strict-transport-security"]).toBe("max-age=31536000");
    expect(basliklar["content-security-policy"]).toBeUndefined();
  });
});
