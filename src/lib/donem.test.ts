import { describe, expect, it } from "vitest";
import { donemCoz, sonAylar, karsilastirmaAraliklari } from "@/lib/donem";
import { TUM_ZAMANLAR } from "@/lib/zaman";

// X-1 §(2): ekranın varsayılan dönemi içinde bulunulan aydır; "tüm zamanlar" bilinçli seçimdir.
const an = new Date("2026-10-17T09:00:00Z");

describe("donemCoz — rapor ekranının dönem parametresi", () => {
  it("parametre yoksa içinde bulunulan ay", () => {
    const d = donemCoz(undefined, an);
    expect(d.anahtar).toBe("2026-10");
    expect(d.aralik.baslangic.toISOString()).toBe("2026-09-30T21:00:00.000Z");
  });

  it("YYYY-AA verilen ayı seçer", () => {
    const d = donemCoz("2026-03", an);
    expect(d.anahtar).toBe("2026-03");
    expect(d.aralik.bitis.toISOString()).toBe("2026-03-31T21:00:00.000Z");
  });

  it("'tum' tüm zamanlar aralığıdır", () => {
    const d = donemCoz("tum", an);
    expect(d.anahtar).toBe("tum");
    expect(d.aralik).toEqual(TUM_ZAMANLAR);
  });

  it("geçersiz değer içinde bulunulan aya düşer", () => {
    for (const p of ["2026-13", "2026-00", "abc", "2026-1"]) expect(donemCoz(p, an).anahtar).toBe("2026-10");
  });
});

describe("sonAylar — KPI serisinin ayları", () => {
  it("bitiş ayıyla biten n ay, eskiden yeniye; yıl sınırını aşar", () => {
    const aylar = sonAylar(3, { yil: 2026, ay: 1 }, new Date("2026-01-15T10:00:00Z"));
    expect(aylar.map((a) => [a.yil, a.ay])).toEqual([
      [2025, 11],
      [2025, 12],
      [2026, 1],
    ]);
  });

  it("devam eden ay işaretlidir, geçmiş aylar değildir", () => {
    const aylar = sonAylar(2, { yil: 2026, ay: 10 }, new Date("2026-10-26T12:00:00Z"));
    expect(aylar.map((a) => a.devamEdiyor)).toEqual([false, true]);
  });

  it("aralıklar İstanbul ayının yarı açık sınırlarıdır", () => {
    const [ay] = sonAylar(1, { yil: 2026, ay: 10 });
    expect(ay.aralik.baslangic.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(ay.aralik.bitis.toISOString()).toBe("2026-10-31T21:00:00.000Z");
  });
});

describe("karsilastirmaAraliklari — K-1 aynı gün aralığı", () => {
  it("devam eden ay: ay başından ana kadar, önceki ayın aynı uzunluktaki başıyla", () => {
    const an = new Date("2026-10-26T11:00:00Z"); // 26 Ekim 14:00 İstanbul
    const { simdi, onceki } = karsilastirmaAraliklari(donemCoz("2026-10", an), an);
    expect(simdi.baslangic.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(simdi.bitis.toISOString()).toBe("2026-10-26T11:00:00.000Z");
    expect(onceki!.baslangic.toISOString()).toBe("2026-08-31T21:00:00.000Z");
    expect(onceki!.bitis.toISOString()).toBe("2026-09-26T11:00:00.000Z"); // 26 Eylül 14:00
  });

  it("önceki ay kısaysa ay sonuna kırpılır (31 Mart → Şubat sonu)", () => {
    const an = new Date("2026-03-31T09:00:00Z");
    const { onceki } = karsilastirmaAraliklari(donemCoz("2026-03", an), an);
    expect(onceki!.bitis.toISOString()).toBe("2026-02-28T21:00:00.000Z"); // 1 Mart 00:00 İstanbul
  });

  it("geçmiş ay: tam ay, önceki tam ayla", () => {
    const an = new Date("2026-10-26T11:00:00Z");
    const { simdi, onceki } = karsilastirmaAraliklari(donemCoz("2026-09", an), an);
    expect(simdi.bitis.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(onceki!.baslangic.toISOString()).toBe("2026-07-31T21:00:00.000Z");
    expect(onceki!.bitis.toISOString()).toBe("2026-08-31T21:00:00.000Z");
  });

  it("ocak ayı önceki yılın aralığıyla kıyaslanır", () => {
    const { onceki } = karsilastirmaAraliklari(donemCoz("2026-01"), new Date("2026-06-01T00:00:00Z"));
    expect(onceki!.baslangic.toISOString()).toBe("2025-11-30T21:00:00.000Z");
  });

  it("tüm zamanların karşılaştırması yoktur", () => {
    expect(karsilastirmaAraliklari(donemCoz("tum")).onceki).toBeNull();
  });
});
