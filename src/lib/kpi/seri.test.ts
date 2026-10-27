import { describe, expect, it } from "vitest";

import { dashboardAraligi, sonAylar } from "@/lib/donem";
import { doldur, kovalaraBol } from "@/lib/kpi/seri";

describe("kovalaraBol — İstanbul ay ve hafta sınırları", () => {
  const aylar = sonAylar(2, { yil: 2026, ay: 10 }, new Date("2026-10-26T12:00:00Z")); // Eylül, Ekim

  it("ay sonu 23:30 o aya, ay başı 00:30 sonraki aya düşer", () => {
    const kayitlar = [
      { ad: "eylül-son", t: new Date("2026-09-30T20:30:00Z") }, // 30 Eylül 23:30 İstanbul
      { ad: "ekim-ilk", t: new Date("2026-09-30T21:30:00Z") }, // 1 Ekim 00:30 İstanbul
    ];
    const [eylul, ekim] = kovalaraBol(kayitlar, aylar, (k) => k.t);
    expect(eylul.map((k) => k.ad)).toEqual(["eylül-son"]);
    expect(ekim.map((k) => k.ad)).toEqual(["ekim-ilk"]);
  });

  it("hiçbir aya düşmeyen kayıt atılır", () => {
    const [eylul, ekim] = kovalaraBol([{ t: new Date("2026-08-15T00:00:00Z") }], aylar, (k) => k.t);
    expect(eylul.length + ekim.length).toBe(0);
  });

  it("hafta kovası: Pazar 23:30 o haftaya, Pazartesi 00:30 sonraki haftaya düşer", () => {
    const haftalar = dashboardAraligi("ay", new Date("2026-10-27T11:00:00Z")).kovalar.slice(-2);
    const kayitlar = [
      { ad: "pazar", t: new Date("2026-10-25T20:30:00Z") }, // Pazar 25 Ekim 23:30 İstanbul
      { ad: "pazartesi", t: new Date("2026-10-25T21:30:00Z") }, // Pazartesi 26 Ekim 00:30 İstanbul
    ];
    const [gecen, bu] = kovalaraBol(kayitlar, haftalar, (k) => k.t);
    expect(gecen.map((k) => k.ad)).toEqual(["pazar"]);
    expect(bu.map((k) => k.ad)).toEqual(["pazartesi"]);
  });
});

describe("doldur — eksik ay kuralı", () => {
  const aylar = sonAylar(3, { yil: 2026, ay: 10 });
  const veri = new Map([["2026-10", 5]]);
  const bul = (a: { yil: number; ay: number }) => veri.get(`${a.yil}-${String(a.ay).padStart(2, "0")}`);

  it("sayım ve ciro: kayıt yoksa gerçek değer 0", () => {
    expect(doldur(aylar, bul, 0, "sifir")).toEqual([0, 0, 5]);
  });

  it("ölçüm: veri yoksa boşluk, enterpolasyon yok", () => {
    expect(doldur(aylar, bul, 0, "bosluk")).toEqual([null, null, 5]);
  });
});
