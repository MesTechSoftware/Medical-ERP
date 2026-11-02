import { describe, expect, it } from "vitest";
import { BOS_SUZGEC, HIZLI_SEKMELER, ayniSuzgec, bosDurum, etkinSuzgecler, listeAdresi, suzgecCoz } from "./suzgec";

describe("fiyat listesi süzgeci (spec Ü-21 §3.3)", () => {
  it("durum ve detay çözülür; geçersiz değer yok sayılır", () => {
    expect(suzgecCoz({ durum: "aktif", detay: "cm-1" })).toEqual({ suzgec: { durum: "aktif" }, detay: "cm-1" });
    expect(suzgecCoz({ durum: ["bos", "aktif"] }).suzgec).toEqual({ durum: "bos" });
    expect(suzgecCoz({ durum: "AKTIF" }).suzgec).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ durum: "x" }).suzgec).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ detay: "a b" }).detay).toBeNull();
    expect(suzgecCoz({}).detay).toBeNull();
  });

  it("adres süzgeci, sayfayı ve paneli taşır; ilk sayfa yazılmaz; gidiş-dönüş aynıdır", () => {
    expect(listeAdresi(BOS_SUZGEC)).toBe("/price-lists");
    expect(listeAdresi({ durum: "bos" }, { page: 2, detay: "x" })).toBe("/price-lists?durum=bos&page=2&detay=x");
    expect(listeAdresi({ durum: "aktif" }, { page: 1, per: 50 })).toBe("/price-lists?durum=aktif&per=50");
    for (const s of [BOS_SUZGEC, { durum: "aktif" as const }, { durum: "bos" as const }]) {
      const q = Object.fromEntries(new URL(listeAdresi(s), "http://x").searchParams);
      expect(suzgecCoz(q).suzgec).toEqual(s);
    }
  });

  it("hızlı sekmeler sırası ve etkinlik", () => {
    expect(HIZLI_SEKMELER.map((s) => s.etiket)).toEqual(["Tümü", "Aktif", "Boş"]);
    expect(HIZLI_SEKMELER.filter((s) => ayniSuzgec(s.suzgec, { durum: "bos" })).map((s) => s.etiket)).toEqual(["Boş"]);
  });

  it("etkin süzgeç etiketi ve kaldırma adresi", () => {
    expect(etkinSuzgecler(BOS_SUZGEC)).toEqual([]);
    expect(etkinSuzgecler({ durum: "aktif" })).toEqual([{ anahtar: "durum", etiket: "Durum: Aktif", kaldirAdresi: "/price-lists" }]);
    expect(etkinSuzgecler({ durum: "bos" })[0].etiket).toBe("Durum: Boş");
  });

  it("boş durum türü", () => {
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum({ durum: "bos" })).toBe("suzgecli");
  });
});
