import { describe, expect, it } from "vitest";
import { hesaplaKomisyonTutari, hesaplaSatirTutarlari, type SatirGirdisi } from "@/lib/satir-tutarlari";

// `vat.test.ts`'in (15 test) Decimal karşılığı — C-6 §(5), X-5 §(7). FAZ1 §D.1 CM: "yeniden yazılır".
const satir = (birimFiyat: string, miktar: number, kdvOrani: string, listeFiyat = birimFiyat): SatirGirdisi => ({
  birimFiyat,
  listeFiyat,
  miktar,
  kdvOrani,
});
const tek = (s: SatirGirdisi) => hesaplaSatirTutarlari([s]).satirlar[0];

describe("hesaplaSatirTutarlari — satır", () => {
  it("%20 KDV'yi hesaplar (PRD örnek senaryosu)", () => {
    const s = tek(satir("850", 700, "20"));
    expect(s.matrah.toFixed(2)).toBe("595000.00");
    expect(s.kdvTutar.toFixed(2)).toBe("119000.00");
    expect(s.toplam.toFixed(2)).toBe("714000.00");
  });

  it("kuruş altını yarım sıfırdan uzağa yuvarlar (X-5 §(7))", () => {
    expect(tek(satir("0.03", 1, "20")).kdvTutar.toFixed(2)).toBe("0.01"); // 0,006 → 0,01
    expect(tek(satir("0.02", 1, "20")).kdvTutar.toFixed(2)).toBe("0.00"); // 0,004 → 0,00
    expect(tek(satir("0.05", 1, "10")).kdvTutar.toFixed(2)).toBe("0.01"); // 0,005 tam yarım → 0,01
  });

  it("4 haneli birim fiyatta matrahı 2 haneye yuvarlar", () => {
    // 12,3456 × 3 = 37,0368 → 37,04
    expect(tek(satir("12.3456", 3, "20")).matrah.toFixed(2)).toBe("37.04");
  });

  it("%0 oranını destekler", () => {
    const s = tek(satir("123.45", 1, "0"));
    expect(s.kdvTutar.toFixed(2)).toBe("0.00");
    expect(s.toplam.toFixed(2)).toBe("123.45");
  });

  it("geçersiz oranı reddeder", () => {
    expect(() => tek(satir("1", 1, "-1"))).toThrow();
    expect(() => tek(satir("1", 1, "101"))).toThrow();
  });

  it("geçersiz miktarı reddeder (miktar tam sayıdır — X-5 §(8))", () => {
    expect(() => tek(satir("1", 0, "20"))).toThrow();
    expect(() => tek(satir("1", -1, "20"))).toThrow();
    expect(() => tek(satir("1", 1.5, "20"))).toThrow();
  });

  it("satıcının girdiği fiyat aynen korunur — oran türetilir (X-5 §(9)/(10) bulgusu)", () => {
    // liste 1.000,00 · satıcı 873,45 → iskonto %12,655 → 12,66; matrah 873,45 kalır.
    const s = tek(satir("873.45", 1, "20", "1000"));
    expect(s.matrah.toFixed(2)).toBe("873.45");
    expect(s.iskontoOran?.toFixed(2)).toBe("12.66");
  });

  it("liste üstü satışta iskonto negatiftir (X-5 §(11))", () => {
    expect(tek(satir("1100", 1, "20", "1000")).iskontoOran?.toFixed(2)).toBe("-10.00");
  });

  it("liste fiyatı 0 ise iskonto yoktur (sıfıra bölme yok)", () => {
    expect(tek(satir("0", 1, "20", "0")).iskontoOran).toBeNull();
  });

  it("bedelsiz satırın tutarı ve KDV'si 0'dır (A-2, C-6 §(8))", () => {
    const s = tek({ ...satir("120", 5, "20"), bedelsiz: true });
    expect(s.matrah.toFixed(2)).toBe("0.00");
    expect(s.kdvTutar.toFixed(2)).toBe("0.00");
    expect(s.iskontoOran).toBeNull();
  });
});

describe("hesaplaSatirTutarlari — 🔴 belge toplamı = satır toplamlarının toplamı (C-6 §(5))", () => {
  it("boş belgede sıfır döner", () => {
    const { toplam } = hesaplaSatirTutarlari([]);
    expect(toplam.matrah.toFixed(2)).toBe("0.00");
    expect(toplam.kdvTutar.toFixed(2)).toBe("0.00");
    expect(toplam.toplam.toFixed(2)).toBe("0.00");
    expect(toplam.iskontoOran).toBeNull();
  });

  it("satır bazında yuvarlanan KDV'lerin toplamı belge KDV'sidir", () => {
    const { satirlar, toplam } = hesaplaSatirTutarlari([
      satir("0.03", 1, "20"),
      satir("0.03", 1, "20"),
      satir("0.03", 1, "20"),
    ]);
    expect(toplam.matrah.toFixed(2)).toBe("0.09");
    expect(toplam.kdvTutar.toFixed(2)).toBe("0.03"); // 3 × 0,01 — toplamdan hesaplansa 0,02 olurdu
    expect(toplam.toplam.toFixed(2)).toBe("0.12");
    const satirToplami = satirlar.reduce((t, s) => t.plus(s.toplam), satirlar[0].toplam.minus(satirlar[0].toplam));
    expect(satirToplami.toFixed(2)).toBe(toplam.toplam.toFixed(2));
  });

  it("toplam üzerinden hesaplamak farklı sonuç verir — kural satır bazıdır", () => {
    const { toplam } = hesaplaSatirTutarlari(Array.from({ length: 7 }, () => satir("0.01", 1, "20")));
    expect(toplam.kdvTutar.toFixed(2)).toBe("0.00"); // 7 × round(0,002) = 0
    // Toplamdan olsaydı round(0,07 × 0,20) = round(0,014) = 0,01 → KURAL BU DEĞİL
  });

  it("karma oranlı belgede her satır kendi oranıyla hesaplanır (C-6)", () => {
    const { toplam } = hesaplaSatirTutarlari([satir("100", 1, "20"), satir("100", 1, "10")]);
    expect(toplam.kdvTutar.toFixed(2)).toBe("30.00");
    expect(toplam.toplam.toFixed(2)).toBe("230.00");
  });

  it("ortalama iskonto tutar ağırlıklıdır; bedelsiz satır ortalamaya girmez", () => {
    const { toplam } = hesaplaSatirTutarlari([
      satir("900", 10, "20", "1000"), // liste 10.000, satış 9.000
      satir("1000", 1, "20", "1000"), // liste 1.000, satış 1.000
      { ...satir("1000", 5, "20", "1000"), bedelsiz: true },
    ]);
    // (11.000 − 10.000) / 11.000 = %9,09
    expect(toplam.iskontoOran?.toFixed(2)).toBe("9.09");
  });
});

describe("hesaplaKomisyonTutari (A-11)", () => {
  it("tutar × oran / 100, 2 hane, yarım sıfırdan uzağa", () => {
    expect(hesaplaKomisyonTutari("1000", "2.5").toFixed(2)).toBe("25.00");
    expect(hesaplaKomisyonTutari("0.10", "5").toFixed(2)).toBe("0.01"); // 0,005 → 0,01
    expect(hesaplaKomisyonTutari("500", "0").toFixed(2)).toBe("0.00");
  });
});

// X-14 §(4) · C-6 §(6): hakediş = satır matrahı × satıra donmuş oran. Ham aritmetik
// yalnız bu fonksiyondadır (X-5 §(4)); rapor toplamı buradan alır (X-1).
describe("hesaplaSatirTutarlari — hakediş (X-14-1 · D-4-1)", () => {
  const primli = (birimFiyat: string, miktar: number, primOrani: string | null, bedelsiz = false): SatirGirdisi => ({
    ...satir(birimFiyat, miktar, "20"),
    primOrani,
    bedelsiz,
  });

  it("matrah × oran / 100, 2 hane, yarım sıfırdan uzağa", () => {
    expect(tek(primli("90", 4, "5")).hakedis.toFixed(2)).toBe("18.00"); // 360 × %5
    expect(tek(primli("0.10", 1, "5")).hakedis.toFixed(2)).toBe("0.01"); // 0,005 → 0,01
  });

  it("oranı boş satır ve bedelsiz satır hakediş doğurmaz", () => {
    expect(tek(primli("100", 1, null)).hakedis.toFixed(2)).toBe("0.00");
    expect(tek(satir("100", 1, "20")).hakedis.toFixed(2)).toBe("0.00");
    expect(tek(primli("100", 1, "5", true)).hakedis.toFixed(2)).toBe("0.00");
  });

  it("belge hakedişi satır hakedişlerinin toplamıdır; her satır kendi oranıyla", () => {
    const { toplam } = hesaplaSatirTutarlari([primli("100", 1, "5"), primli("200", 1, "10"), primli("50", 1, null)]);
    expect(toplam.hakedis.toFixed(2)).toBe("25.00");
  });

  it("hakediş satır bazında yuvarlanır, sonra toplanır (C-6 §(5) deseni)", () => {
    // Her satır 0,10 × %5 = 0,005 → 0,01; toplam üzerinden yuvarlansaydı 0,010 → 0,01.
    const { toplam } = hesaplaSatirTutarlari([primli("0.10", 1, "5"), primli("0.10", 1, "5")]);
    expect(toplam.hakedis.toFixed(2)).toBe("0.02");
  });

  it("geçersiz oranı reddeder", () => {
    expect(() => tek(primli("100", 1, "-1"))).toThrow();
    expect(() => tek(primli("100", 1, "100.01"))).toThrow();
  });
});
