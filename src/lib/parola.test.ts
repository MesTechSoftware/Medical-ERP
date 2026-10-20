import { describe, expect, it } from "vitest";

import { ASGARI_UZUNLUK, parolaDogru, parolaHashle, parolaHatasi } from "@/lib/parola";

// E-2-6 — parola politikası (E-2 §(5), 20.10.2026 eki).
describe("parolaHatasi (E-2-6)", () => {
  it("asgari uzunluk 8: 7 karakter reddedilir, 8 karakter geçer", () => {
    expect(ASGARI_UZUNLUK).toBe(8);
    expect(parolaHatasi("Kx7#mq2", "p")).toEqual({ kademe: "SERT", kural_kodu: "PAROLA_KISA", parametreler: { asgari: 8 }, alan: "p" });
    expect(parolaHatasi("Kx7#mq2a", "p")).toBeNull();
  });

  it("karmaşıklık kuralı yoktur: yalnız küçük harfli uzun parola geçer", () => {
    expect(parolaHatasi("kırmızıelmaağacı", "p")).toBeNull();
  });

  it("yaygın parola büyük/küçük harf farkı gözetilmeden reddedilir", () => {
    for (const p of ["12345678", "password", "PassWord", "QWERTYUIOP", "Galatasaray", "IZMIR035", "ŞİFRE123", "Medikal123"]) {
      expect(parolaHatasi(p, "p")?.kural_kodu, p).toBe("PAROLA_YAYGIN");
    }
  });
});

describe("parolaHashle / parolaDogru (E-2 §(5))", () => {
  it("bcrypt hash'i parolanın kendisini içermez ve doğrulanır", async () => {
    const hash = await parolaHashle("kirmizi-elma-7");
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).not.toContain("kirmizi-elma-7");
    expect(await parolaDogru("kirmizi-elma-7", hash)).toBe(true);
    expect(await parolaDogru("kirmizi-elma-8", hash)).toBe(false);
  });
});
