import { describe, expect, it } from "vitest";
import { BOS_SUZGEC, SAHIPSIZ, bosDurum, etkinSuzgecler, korunanlar, raporAdresi, saticiAdresi, suzgecCoz, type RaporSuzgeci } from "./suzgec";

const S = (ek: Partial<RaporSuzgeci>): RaporSuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("rapor süzgeci (spec Ü-27 §3.3)", () => {
  it("gidiş-dönüş; dönem korunur; ilk sayfa yazılmaz", () => {
    expect(suzgecCoz({})).toEqual(BOS_SUZGEC);
    expect(raporAdresi(BOS_SUZGEC, { page: 1 })).toBe("/reports");
    const s = suzgecCoz({ donem: "2026-10", satici: "u-1", q: "ışık" });
    expect(s).toEqual({ donem: "2026-10", satici: "u-1", q: "ışık" });
    expect(raporAdresi(s, { page: 2, per: 50 })).toBe("/reports?donem=2026-10&satici=u-1&q=%C4%B1%C5%9F%C4%B1k&page=2&per=50");
  });

  it("geçersiz dönem düşer, tüm zamanlar kalır; sahipsiz geçerli", () => {
    expect(suzgecCoz({ donem: "2026-13" }).donem).toBeNull();
    expect(suzgecCoz({ donem: "x" }).donem).toBeNull();
    expect(suzgecCoz({ donem: "tum" }).donem).toBe("tum");
    expect(suzgecCoz({ satici: SAHIPSIZ }).satici).toBe(SAHIPSIZ);
    expect(suzgecCoz({ q: "x".repeat(150) }).q).toHaveLength(100);
  });

  it("dönem seçicinin gizli alanları ve satıcı bağlantısı", () => {
    expect(korunanlar(S({ donem: "2026-10", satici: "u-1" }))).toEqual({ satici: "u-1" });
    expect(korunanlar(BOS_SUZGEC)).toEqual({});
    expect(saticiAdresi(S({ donem: "2026-10", q: "x" }), "u-2")).toBe("/reports?donem=2026-10&satici=u-2");
  });

  it("etiketler; adı bilinmeyen satıcı etiketsiz; boş durum", () => {
    const ad = (id: string) => (id === "u-1" ? "Ali" : undefined);
    expect(etkinSuzgecler(S({ donem: "2026-10", satici: "u-1", q: "x" }), ad).map((e) => [e.etiket, e.kaldirAdresi])).toEqual([
      ["Satıcı: Ali", "/reports?donem=2026-10&q=x"],
      ["Ara: x", "/reports?donem=2026-10&satici=u-1"],
    ]);
    expect(etkinSuzgecler(S({ satici: SAHIPSIZ }), ad).map((e) => e.etiket)).toEqual(["Sahipsiz"]);
    expect(etkinSuzgecler(S({ satici: "u-9" }), ad)).toEqual([]);
    expect(bosDurum(S({ donem: "2026-10" }))).toBe("hic-kayit");
    expect(bosDurum(S({ q: "x" }))).toBe("suzgecli");
  });
});
