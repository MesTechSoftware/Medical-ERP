import { describe, expect, it } from "vitest";
import { faturaKartiMetni } from "@/lib/fatura-karti-metni";
import type { FaturaKarti } from "@/lib/disa-aktarim";

// A-13-4 / D-3-3: "Tümünü Kopyala" metni (KARARLAR §5.23 S3).
const kolonlar = ["FATURA_UNVANI", "VKN_TCKN", "VERGI_DAIRESI", "FATURA_ADRESI", "FATURA_ILCE", "FATURA_IL", "URUN_ADI", "MIKTAR", "KDV_ORANI", "MATRAH", "KDV_TUTARI", "TOPLAM"];
const karti = (satirlar: (string | null)[][]) =>
  ({
    veri: { kolonlar: kolonlar.map((kod) => ({ kod })), satirlar },
    kdvKirilimi: [{ oran: "20.00", matrah: "100.00", kdv: "20.00", toplam: "120.00" }],
    toplam: { matrah: "100.00", kdv: "20.00", toplam: "120.00" },
    bedelsizSatir: 0,
    eksikFaturaBilgisi: null,
    geriyeDonuk: null,
  }) as unknown as FaturaKarti;

describe("faturaKartiMetni", () => {
  it("muhatap Etiket: değer, boş satır, sekmeli kalem, KDV kırılımı, toplam ve bilgi notu", () => {
    const m = faturaKartiMetni("SVK-1", karti([["Acme", "123", "KD", null, "Kadıköy", "İstanbul", "Vida", "2", "20.00", "100.00", "20.00", "120.00"]]));
    const satirlar = m.split("\n");
    expect(satirlar[0]).toBe("Fatura bilgisi — SVK-1");
    expect(satirlar).toContain("Fatura unvanı: Acme");
    expect(satirlar).toContain("Fatura adresi: —");
    expect(satirlar).toContain("Vida\t2\t20.00\t100.00\t20.00\t120.00");
    expect(satirlar).toContain("KDV %20.00 — matrah: 100.00 · KDV: 20.00");
    expect(satirlar).toContain("Toplam: 120.00");
    expect(satirlar.at(-1)).toBe("Bilgi amaçlıdır — mali belge değildir.");
    expect(satirlar).toContain("");
  });

  it("satırsız kart: hazırlığa girmiyor notu", () => {
    expect(faturaKartiMetni("SVK-2", karti([]))).toContain("fatura hazırlığına girmiyor");
  });
});
