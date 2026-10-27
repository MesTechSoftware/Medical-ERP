import { describe, expect, it } from "vitest";

import { formatGunSuresi, formatSayi, goreliZaman, kovaEtiketi } from "@/lib/format";

describe("formatSayi", () => {
  it("adet tr-TR binlik ayırıcıyla", () => {
    expect(formatSayi(1250)).toBe("1.250");
    expect(formatSayi(0)).toBe("0");
  });
});

describe("formatGunSuresi — medyan hazırlama süresi", () => {
  it("gün, her zaman 1 ondalık, tr-TR", () => {
    expect(formatGunSuresi(1.4)).toBe("1,4 gün");
    expect(formatGunSuresi(0)).toBe("0,0 gün");
    expect(formatGunSuresi(12)).toBe("12,0 gün");
  });
});

describe("kovaEtiketi — mikro grafik kovasının adı (İstanbul)", () => {
  const kova = (bas: string, bit: string) => ({ aralik: { baslangic: new Date(bas), bitis: new Date(bit) }, devamEdiyor: false });

  it("gün '27 Eki'; ay 'Eki'", () => {
    expect(kovaEtiketi(kova("2026-10-26T21:00:00Z", "2026-10-27T21:00:00Z"), "gun")).toBe("27 Eki");
    expect(kovaEtiketi(kova("2026-09-30T21:00:00Z", "2026-10-31T21:00:00Z"), "ay")).toBe("Eki");
  });

  it("hafta Pazartesi–Pazar: aynı ayda '19–25 Eki', ay geçişinde '26 Eki – 1 Kas'", () => {
    expect(kovaEtiketi(kova("2026-10-18T21:00:00Z", "2026-10-25T21:00:00Z"), "hafta")).toBe("19–25 Eki");
    expect(kovaEtiketi(kova("2026-10-25T21:00:00Z", "2026-11-01T21:00:00Z"), "hafta")).toBe("26 Eki – 1 Kas");
  });
});

describe("goreliZaman — aktivite akışının zamanı", () => {
  const simdi = new Date("2026-10-27T11:00:00Z");
  const once = (ms: number) => goreliZaman(new Date(simdi.getTime() - ms), simdi);

  it("dakika, saat, gün; bir haftadan eskisi tarih", () => {
    expect(once(30_000)).toBe("az önce");
    expect(once(12 * 60_000)).toBe("12 dk önce");
    expect(once(3 * 3_600_000)).toBe("3 sa önce");
    expect(once(2 * 86_400_000)).toBe("2 gün önce");
    expect(once(7 * 86_400_000)).toBe("20.10.2026");
  });

  it("gelecekteki an (saat kayması) 'az önce'", () => {
    expect(once(-90_000)).toBe("az önce");
  });
});
