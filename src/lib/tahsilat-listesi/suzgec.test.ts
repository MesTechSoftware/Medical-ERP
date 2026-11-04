import { describe, expect, it } from "vitest";
import {
  BOS_SUZGEC,
  bosDurum,
  etkinSuzgecler,
  kartAdresi,
  kpiAraligi,
  sekmeAdresi,
  suzgecCoz,
  tahsilatAdresi,
  type TahsilatSuzgeci,
} from "./suzgec";

const S = (ek: Partial<TahsilatSuzgeci>): TahsilatSuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("tahsilat süzgeci (spec Ü-26 §3.3)", () => {
  it("varsayılan aktif; adres gidiş-dönüş; aktif ve ilk sayfa yazılmaz", () => {
    expect(suzgecCoz({}).suzgec).toEqual(BOS_SUZGEC);
    expect(BOS_SUZGEC.durum).toBe("aktif");
    expect(tahsilatAdresi(BOS_SUZGEC, { page: 1 })).toBe("/collections");
    const { suzgec, detay } = suzgecCoz({ baslangic: "2026-11-01", bitis: "2026-11-04", durum: "IPTAL", tip: "POS", q: "THS-1", detay: "p-1" });
    expect(suzgec).toEqual({ baslangic: "2026-11-01", bitis: "2026-11-04", durum: "IPTAL", tip: "POS", q: "THS-1" });
    expect(detay).toBe("p-1");
    expect(tahsilatAdresi(suzgec, { page: 2, per: 50, detay: "p-1" })).toBe(
      "/collections?baslangic=2026-11-01&bitis=2026-11-04&durum=IPTAL&tip=POS&q=THS-1&page=2&per=50&detay=p-1"
    );
  });

  it("geçersiz değer yok sayılır; ters tarih yer değiştirir; boş metin düşer", () => {
    expect(suzgecCoz({ durum: "x", tip: "KART", q: "  " }).suzgec).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ baslangic: "2026-11-04", bitis: "2026-11-01" }).suzgec).toMatchObject({ baslangic: "2026-11-01", bitis: "2026-11-04" });
    expect(suzgecCoz({ q: "x".repeat(150) }).suzgec.q).toHaveLength(100);
  });

  it("tarih sekmesi yalnız tarihi yazar, öbür süzgeçleri korur", () => {
    expect(sekmeAdresi(S({ tip: "NAKIT" }), { baslangic: "2026-11-04", bitis: "2026-11-04" })).toBe(
      "/collections?baslangic=2026-11-04&bitis=2026-11-04&tip=NAKIT"
    );
  });

  it("KPI aralığı: süzgeç tarihi, yoksa bu ay; kart adresi aralığı yazar (A-11-2)", () => {
    expect(kpiAraligi(BOS_SUZGEC, "2026-11-04")).toEqual({ baslangic: "2026-11-01", bitis: "2026-11-04", varsayilan: true });
    expect(kpiAraligi(S({ baslangic: "2026-10-01", bitis: "2026-10-31", tip: "POS" }), "2026-11-04")).toEqual({
      baslangic: "2026-10-01",
      bitis: "2026-10-31",
      varsayilan: false,
    });
    const a = { baslangic: "2026-11-01", bitis: "2026-11-04" };
    expect(kartAdresi("POS", a)).toBe("/collections?baslangic=2026-11-01&bitis=2026-11-04&tip=POS");
    expect(kartAdresi(null, a)).toBe("/collections?baslangic=2026-11-01&bitis=2026-11-04");
  });

  it("etiketler; varsayılan etiketsiz; boş durum", () => {
    const s = S({ baslangic: "2026-11-01", bitis: "2026-11-04", durum: "IPTAL", tip: "POS", q: "x" });
    expect(etkinSuzgecler(s).map((e) => e.etiket)).toEqual(["Tarih: 01.11.2026 – 04.11.2026", "Durum: İptal edilen", "Yöntem: POS", "Ara: x"]);
    expect(etkinSuzgecler(s).find((e) => e.anahtar === "tip")?.kaldirAdresi).toBe(
      "/collections?baslangic=2026-11-01&bitis=2026-11-04&durum=IPTAL&q=x"
    );
    expect(etkinSuzgecler(S({ durum: "tumu" })).map((e) => e.etiket)).toEqual(["Durum: Tümü"]);
    expect(etkinSuzgecler(BOS_SUZGEC)).toEqual([]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(S({ tip: "POS" }))).toBe("suzgecli");
  });
});
