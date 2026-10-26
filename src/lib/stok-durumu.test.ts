import { describe, expect, it } from "vitest";

import { CRITICAL_STOCK, stokDurumu } from "@/lib/stok-durumu";

describe("stok durumu (ADR-009 — iki seviye)", () => {
  it("sıfır ve negatif stok tükenmiştir (hata); negatif stok engellenmez, B-4", () => {
    expect(stokDurumu(-1)).toEqual({ ton: "hata", etiket: "Tükendi" });
    expect(stokDurumu(0)).toEqual({ ton: "hata", etiket: "Tükendi" });
  });

  it("eşiğe kadar (dahil) kritik stoktur (uyarı)", () => {
    expect(stokDurumu(1)).toEqual({ ton: "uyari", etiket: "Kritik" });
    expect(stokDurumu(CRITICAL_STOCK)).toEqual({ ton: "uyari", etiket: "Kritik" });
  });

  it("eşiğin üstünde durum yoktur", () => {
    expect(CRITICAL_STOCK).toBe(10);
    expect(stokDurumu(CRITICAL_STOCK + 1)).toBeNull();
  });
});
