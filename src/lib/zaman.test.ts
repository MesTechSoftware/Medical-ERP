import { describe, expect, it } from "vitest";
import { bugun, gunAraligi, gunEkle, takvimYili } from "@/lib/zaman";

// E-1: "gün" İstanbul takvim günüdür; sunucunun dilimi belirleyici değildir.
// Testler UTC anlarla yazılır — makinenin dilimi sonucu değiştiremez.

describe("gunAraligi — yarı açık [başlangıç, bitiş) (E-1 §(4))", () => {
  it("İstanbul gününün sınırlarını UTC olarak verir", () => {
    const { baslangic, bitis } = gunAraligi(new Date("2026-10-04T12:00:00Z"));
    expect(baslangic.toISOString()).toBe("2026-10-03T21:00:00.000Z");
    expect(bitis.toISOString()).toBe("2026-10-04T21:00:00.000Z");
  });

  it("UTC'de önceki gün olan an İstanbul'da ertesi güne düşer", () => {
    // 2026-10-03 22:30 UTC = 2026-10-04 01:30 İstanbul
    const { baslangic } = gunAraligi(new Date("2026-10-03T22:30:00Z"));
    expect(baslangic.toISOString()).toBe("2026-10-03T21:00:00.000Z");
  });

  it("ay ve yıl sonunu aşar", () => {
    const { bitis } = gunAraligi(new Date("2026-12-31T10:00:00Z"));
    expect(bitis.toISOString()).toBe("2026-12-31T21:00:00.000Z");
  });
});

describe("bugun — date kolonu biçimi", () => {
  it("İstanbul takvim gününü UTC gece yarısı olarak verir", () => {
    expect(bugun(new Date("2026-10-03T22:30:00Z")).toISOString()).toBe("2026-10-04T00:00:00.000Z");
  });
});

describe("takvimYili — A-14 sayaç yılı", () => {
  it("yılbaşı gecesi İstanbul yılını verir, UTC yılını değil", () => {
    expect(takvimYili(new Date("2026-12-31T21:30:00Z"))).toBe(2027);
    expect(takvimYili(new Date("2026-12-31T20:30:00Z"))).toBe(2026);
  });
});

describe("gunEkle", () => {
  it("takvim gününe gün ekler", () => {
    expect(gunEkle(new Date("2026-02-27T00:00:00Z"), 2).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});
