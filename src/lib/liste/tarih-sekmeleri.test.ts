import { describe, expect, it } from "vitest";
import { etkinTarihSekmesi, tarihSekmeleri } from "./tarih-sekmeleri";

describe("tarih kısayolları (stok ve kargo ekranları ortak)", () => {
  it("Tümü, Bugün, Son 7 gün, Bu ay; ay başı ve yıl dönümü", () => {
    expect(tarihSekmeleri("2026-01-03")).toEqual([
      { etiket: "Tümü", tarih: { baslangic: null, bitis: null } },
      { etiket: "Bugün", tarih: { baslangic: "2026-01-03", bitis: "2026-01-03" } },
      { etiket: "Son 7 gün", tarih: { baslangic: "2025-12-28", bitis: "2026-01-03" } },
      { etiket: "Bu ay", tarih: { baslangic: "2026-01-01", bitis: "2026-01-03" } },
    ]);
  });

  it("etkin sekme ilk uyan; ayın 1'inde Bugün ile Bu ay aynıdır, Bugün etkindir", () => {
    const s = tarihSekmeleri("2026-11-01");
    expect(etkinTarihSekmesi(s, { baslangic: "2026-11-01", bitis: "2026-11-01" })).toBe("Bugün");
    expect(etkinTarihSekmesi(s, { baslangic: null, bitis: null })).toBe("Tümü");
    expect(etkinTarihSekmesi(s, { baslangic: "2026-10-01", bitis: null })).toBeNull();
  });
});
