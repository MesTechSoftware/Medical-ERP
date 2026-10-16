import { describe, expect, it } from "vitest";

import { modulAcikMi } from "@/lib/modul";
import { policy } from "@/lib/policy";

// `modulAcikMi(kod)` — KABUL_KRITERLERI §1.3-1, K-6-1.

describe("modulAcikMi", () => {
  it("kongre modülü kapalı teslim edilir (K-6-1)", () => {
    expect(modulAcikMi("congress")).toBe(false);
  });

  it("değeri policy.modules'tan okur (§1.3-1)", () => {
    for (const kod of Object.keys(policy.modules) as (keyof typeof policy.modules)[]) {
      expect(modulAcikMi(kod)).toBe(policy.modules[kod]);
    }
  });

  it("ortam değişkeni modülü açamaz (§1.3-1)", () => {
    process.env.MODULE_CONGRESS = "true";
    process.env.MODUL_KONGRE = "true";
    try {
      expect(modulAcikMi("congress")).toBe(false);
    } finally {
      delete process.env.MODULE_CONGRESS;
      delete process.env.MODUL_KONGRE;
    }
  });
});
