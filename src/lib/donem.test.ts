import { describe, expect, it } from "vitest";
import {
  ARALIKLAR,
  aralikCoz,
  dashboardAraligi,
  donemBitisAyi,
  donemAnahtari,
  donemCoz,
  karsilastirmaNotu,
  sonAylar,
  karsilastirmaAraliklari,
  type Aralik,
} from "@/lib/donem";
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

describe("donemAnahtari — süzgecin dönem doğrulaması", () => {
  it("ay ve tüm zamanlar geçer, başka değer null", () => {
    expect(donemAnahtari("2026-03")).toBe("2026-03");
    expect(donemAnahtari("tum")).toBe("tum");
    for (const p of ["2026-13", "2026-00", "abc", "2026-1", "", null, undefined]) expect(donemAnahtari(p)).toBeNull();
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

  it("devam eden ay işaretlidir; geçmiş ay ve tüm zamanlar değildir", () => {
    const an = new Date("2026-10-26T11:00:00Z");
    expect(karsilastirmaAraliklari(donemCoz("2026-10", an), an).devamEdiyor).toBe(true);
    expect(karsilastirmaAraliklari(donemCoz("2026-09", an), an).devamEdiyor).toBe(false);
    expect(karsilastirmaAraliklari(donemCoz("tum"), an).devamEdiyor).toBe(false);
  });
});

describe("karsilastirmaNotu — K-1 tabanı yazılı", () => {
  it("devam eden ay aynı günlerle, geçmiş ay önceki tam ayla", () => {
    expect(karsilastirmaNotu(true)).toBe("geçen ayın aynı günlerine göre");
    expect(karsilastirmaNotu(false)).toBe("önceki aya göre");
  });
});

describe("donemBitisAyi — KPI trendinin son ayı", () => {
  it("seçili ay; tüm zamanlarda içinde bulunulan ay", () => {
    const an = new Date("2026-10-26T11:00:00Z");
    expect(donemBitisAyi(donemCoz("2026-07", an), an)).toEqual({ yil: 2026, ay: 7 });
    expect(donemBitisAyi(donemCoz("tum"), an)).toEqual({ yil: 2026, ay: 10 });
  });
});

describe("dashboardAraligi — zaman filtresi (K-D2, brief §4.1)", () => {
  const an = new Date("2026-10-27T11:00:00Z"); // Salı 27 Ekim 14:00 İstanbul
  const iso = (a: Aralik) => [a.baslangic.toISOString(), a.bitis.toISOString()];

  it("bugün: gün başından ana kadar, dünün aynı saatine kadarla kıyaslanır; 14 günlük kova", () => {
    const r = dashboardAraligi("bugun", an);
    expect(iso(r.simdi)).toEqual(["2026-10-26T21:00:00.000Z", "2026-10-27T11:00:00.000Z"]);
    expect(iso(r.onceki)).toEqual(["2026-10-25T21:00:00.000Z", "2026-10-26T11:00:00.000Z"]);
    expect(r.kovaTuru).toBe("gun");
    expect(r.kovalar).toHaveLength(14);
    expect(iso(r.kovalar[0].aralik)).toEqual(["2026-10-13T21:00:00.000Z", "2026-10-14T21:00:00.000Z"]);
    expect(iso(r.kovalar[13].aralik)).toEqual(["2026-10-26T21:00:00.000Z", "2026-10-27T21:00:00.000Z"]);
    expect(r.kovalar.map((k) => k.devamEdiyor)).toEqual([...Array<boolean>(13).fill(false), true]);
  });

  it("bu hafta: Pazartesi 00:00'dan, geçen haftanın aynı gün ve saatine kadarla; 14 günlük kova", () => {
    const r = dashboardAraligi("hafta", an);
    expect(iso(r.simdi)).toEqual(["2026-10-25T21:00:00.000Z", "2026-10-27T11:00:00.000Z"]);
    expect(iso(r.onceki)).toEqual(["2026-10-18T21:00:00.000Z", "2026-10-20T11:00:00.000Z"]);
    expect(r.kovaTuru).toBe("gun");
    expect(r.kovalar).toEqual(dashboardAraligi("bugun", an).kovalar);
  });

  it("hafta Pazartesi başlar: Pazar 23:59 aynı haftadadır; hafta yıl sınırını aşar", () => {
    const basi = (t: string) => dashboardAraligi("hafta", new Date(t)).simdi.baslangic.toISOString();
    expect(basi("2026-11-01T20:59:59Z")).toBe("2026-10-25T21:00:00.000Z"); // Pazar 1 Kasım 23:59:59
    expect(basi("2026-11-01T21:00:00Z")).toBe("2026-11-01T21:00:00.000Z"); // Pazartesi 2 Kasım 00:00
    expect(basi("2027-01-01T09:00:00Z")).toBe("2026-12-27T21:00:00.000Z"); // Cuma 1 Ocak → 28 Aralık
  });

  it("bu ay: K-1 aynı gün aralığı; 12 haftalık kova, yalnız son hafta devam ediyor", () => {
    const r = dashboardAraligi("ay", an);
    const k = karsilastirmaAraliklari(donemCoz(undefined, an), an);
    expect(r.simdi).toEqual(k.simdi);
    expect(r.onceki).toEqual(k.onceki);
    expect(r.kovaTuru).toBe("hafta");
    expect(r.kovalar).toHaveLength(12);
    expect(iso(r.kovalar[0].aralik)).toEqual(["2026-08-09T21:00:00.000Z", "2026-08-16T21:00:00.000Z"]);
    expect(iso(r.kovalar[11].aralik)).toEqual(["2026-10-25T21:00:00.000Z", "2026-11-01T21:00:00.000Z"]);
    expect(r.kovalar.map((k) => k.devamEdiyor)).toEqual([...Array<boolean>(11).fill(false), true]);
  });

  it("bu yıl: 1 Ocak'tan, geçen yılın aynı gün ve saatine kadarla; 12 aylık kova", () => {
    const r = dashboardAraligi("yil", an);
    expect(iso(r.simdi)).toEqual(["2025-12-31T21:00:00.000Z", "2026-10-27T11:00:00.000Z"]);
    expect(iso(r.onceki)).toEqual(["2024-12-31T21:00:00.000Z", "2025-10-27T11:00:00.000Z"]);
    expect(r.kovaTuru).toBe("ay");
    expect(r.kovalar).toEqual(sonAylar(12, { yil: 2026, ay: 10 }, an));
  });

  it("29 Şubat geçen yılın 28 Şubat'ıyla; artık yıldan sonra 1 Mart, 1 Mart'la kıyaslanır", () => {
    const bitis = (t: string) => dashboardAraligi("yil", new Date(t)).onceki.bitis.toISOString();
    expect(bitis("2028-02-29T12:00:00Z")).toBe("2027-02-28T12:00:00.000Z");
    expect(bitis("2029-03-01T12:00:00Z")).toBe("2028-03-01T12:00:00.000Z");
  });

  it("gün sınırı İstanbul gece yarısıdır", () => {
    const basi = (t: string) => dashboardAraligi("bugun", new Date(t)).simdi.baslangic.toISOString();
    expect(basi("2026-10-26T21:00:00Z")).toBe("2026-10-26T21:00:00.000Z"); // 27 Ekim 00:00
    expect(basi("2026-10-26T20:59:59Z")).toBe("2026-10-25T21:00:00.000Z"); // 26 Ekim 23:59:59
  });

  it("dönem notu, karşılaştırma notu ve seri başlığı aralığa göre", () => {
    expect(ARALIKLAR.map((a) => dashboardAraligi(a, an)).map((r) => [r.donemNotu, r.karsilastirmaNotu, r.seriBasligi])).toEqual([
      ["Bugün", "dünün aynı saatine göre", "Son 14 gün"],
      ["Bu hafta", "geçen haftanın aynı günlerine göre", "Son 14 gün"],
      ["Bu ay", "geçen ayın aynı günlerine göre", "Son 12 hafta"],
      ["Bu yıl", "geçen yılın aynı günlerine göre", "Son 12 ay"],
    ]);
  });
});

describe("aralikCoz — dashboard ?aralik= parametresi", () => {
  it("geçerli anahtar aynen; yoksa ya da geçersizse 'ay' (varsayılan bu ay)", () => {
    for (const a of ARALIKLAR) expect(aralikCoz(a)).toBe(a);
    for (const p of [undefined, "", "gun", "AY", "tum", "2026-10"]) expect(aralikCoz(p)).toBe("ay");
  });
});
