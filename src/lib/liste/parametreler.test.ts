import { describe, expect, it } from "vitest";
import { TUM_ZAMANLAR } from "@/lib/zaman";
import { aralikEtiketi, gun, gunleriAraliga, ilk, kimlik, kpiAraligi, kpiDonemNotu, secenek } from "./parametreler";

describe("adres parametresi yardımcıları", () => {
  it("ilk: dizide ilk eleman, boş metin null", () => {
    expect(ilk({ a: ["x", "y"] }, "a")).toBe("x");
    expect(ilk({ a: "" }, "a")).toBeNull();
    expect(ilk({}, "a")).toBeNull();
  });

  it("secenek: yalnız geçerli değer", () => {
    expect(secenek("B", ["A", "B"] as const)).toBe("B");
    expect(secenek("C", ["A", "B"] as const)).toBeNull();
    expect(secenek(null, ["A"] as const)).toBeNull();
  });

  it("gun: YYYY-AA-GG ve gerçek takvim günü", () => {
    expect(gun("2026-02-28")).toBe("2026-02-28");
    expect(gun("2026-02-30")).toBeNull();
    expect(gun("2026-2-8")).toBeNull();
    expect(gun(null)).toBeNull();
  });

  it("kimlik: harf, rakam, tire; en çok 64", () => {
    expect(kimlik("cm-1")).toBe("cm-1");
    expect(kimlik("a".repeat(64))).toBe("a".repeat(64));
    expect(kimlik("a".repeat(65))).toBeNull();
    expect(kimlik("a b")).toBeNull();
    expect(kimlik(null)).toBeNull();
  });

  it("aralikEtiketi: iki uç, yalnız başlangıç, yalnız bitiş", () => {
    expect(aralikEtiketi("2026-10-01", "2026-10-31")).toBe("01.10.2026 – 31.10.2026");
    expect(aralikEtiketi("2026-10-01", null)).toBe("01.10.2026 sonrası");
    expect(aralikEtiketi(null, "2026-10-31")).toBe("31.10.2026 öncesi");
  });
});

describe("gunleriAraliga", () => {
  it("İstanbul günlerini yarı açık aralığa çevirir: başlangıç günün 00:00'ı, bitiş ertesi günün 00:00'ı", () => {
    expect(gunleriAraliga({ baslangic: "2026-11-01", bitis: "2026-11-30" })).toEqual({
      baslangic: new Date("2026-10-31T21:00:00.000Z"),
      bitis: new Date("2026-11-30T21:00:00.000Z"),
    });
  });

  it("boş ya da geçersiz uç tüm zamanların ucudur", () => {
    expect(gunleriAraliga({ baslangic: null, bitis: null })).toEqual(TUM_ZAMANLAR);
    expect(gunleriAraliga({ baslangic: "2026-02-30", bitis: null })).toEqual(TUM_ZAMANLAR);
  });
});

describe("kpiAraligi / kpiDonemNotu", () => {
  it("süzgeç boşsa bu ay; not \"Bu ay\"", () => {
    const a = kpiAraligi({ baslangic: null, bitis: null }, "2026-11-05");
    expect(a).toEqual({ baslangic: "2026-11-01", bitis: "2026-11-05", varsayilan: true });
    expect(kpiDonemNotu(a)).toBe("Bu ay");
  });

  it("kart bağlantısının yazdığı bu ay aralığı da \"Bu ay\" der (tarih aralığı yazmaz)", () => {
    expect(kpiDonemNotu(kpiAraligi({ baslangic: "2026-11-01", bitis: "2026-11-05" }, "2026-11-05"))).toBe("Bu ay");
  });

  it("başka aralık etiketiyle yazılır", () => {
    expect(kpiDonemNotu(kpiAraligi({ baslangic: "2026-10-01", bitis: "2026-10-31" }, "2026-11-05"))).toBe("01.10.2026 – 31.10.2026");
    expect(kpiDonemNotu(kpiAraligi({ baslangic: "2026-11-01", bitis: null }, "2026-11-05"))).toBe("01.11.2026 sonrası");
  });
});
