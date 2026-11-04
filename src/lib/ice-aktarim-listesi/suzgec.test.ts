import { describe, expect, it } from "vitest";
import { BOS_SUZGEC, bosDurum, durumSekmeleri, etkinSuzgecler, kartAdresleri, partiAdresi, suzgecCoz, type PartiSuzgeci } from "./suzgec";

const S = (ek: Partial<PartiSuzgeci>): PartiSuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("parti süzgeci (spec Ü-30 §3.2)", () => {
  it("varsayılan tümü; gidiş-dönüş; ilk sayfa yazılmaz", () => {
    expect(suzgecCoz({}).suzgec).toEqual(BOS_SUZGEC);
    expect(partiAdresi(BOS_SUZGEC, { page: 1 })).toBe("/imports");
    const { suzgec, detay } = suzgecCoz({ durum: "geri-alindi", tur: "CARI", baslangic: "2026-11-01", bitis: "2026-11-04", q: "x.xlsx", detay: "p-1" });
    expect(suzgec).toEqual({ durum: "geri-alindi", tur: "CARI", baslangic: "2026-11-01", bitis: "2026-11-04", q: "x.xlsx" });
    expect(detay).toBe("p-1");
    expect(partiAdresi(suzgec, { page: 2, per: 50, detay: "p-1" })).toBe(
      "/imports?durum=geri-alindi&tur=CARI&baslangic=2026-11-01&bitis=2026-11-04&q=x.xlsx&page=2&per=50&detay=p-1"
    );
  });

  it("geçersiz değer yok sayılır; ters tarih yer değiştirir", () => {
    expect(suzgecCoz({ durum: "x", tur: "BASKA" }).suzgec).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ baslangic: "2026-11-04", bitis: "2026-11-01" }).suzgec).toMatchObject({ baslangic: "2026-11-01", bitis: "2026-11-04" });
  });

  it("sekmeler yalnız durumu yazar; geri alınabilir sekme değildir", () => {
    const sekmeler = durumSekmeleri(S({ durum: "geri-alinabilir", tur: "URUN" }));
    expect(sekmeler.map((t) => [t.etiket, t.adres, t.etkin])).toEqual([
      ["Tümü", "/imports?tur=URUN", false],
      ["Yazıldı", "/imports?durum=yazildi&tur=URUN", false],
      ["Geri alındı", "/imports?durum=geri-alindi&tur=URUN", false],
    ]);
  });

  it("kart adresleri (X-12-2)", () => {
    expect(kartAdresleri("2026-11-04")).toEqual({
      tumu: "/imports",
      buAy: "/imports?baslangic=2026-11-01&bitis=2026-11-04",
      geriAlinabilir: "/imports?durum=geri-alinabilir",
      geriAlindi: "/imports?durum=geri-alindi",
    });
  });

  it("etiketler ve boş durum", () => {
    expect(etkinSuzgecler(S({ durum: "geri-alinabilir", tur: "ACILIS_STOGU", baslangic: "2026-11-01", q: "dosya" })).map((e) => e.etiket)).toEqual([
      "Durum: Geri alınabilir",
      "Tür: Açılış stoğu",
      "Tarih: 01.11.2026 sonrası",
      "Ara: dosya",
    ]);
    expect(etkinSuzgecler(BOS_SUZGEC)).toEqual([]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(S({ tur: "URUN" }))).toBe("suzgecli");
  });
});
