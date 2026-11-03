import { describe, expect, it } from "vitest";
import { BOS_SUZGEC, bosDurum, durumSekmeleri, etkinSuzgecler, kartAdresleri, onayAdresi, suzgecCoz, type OnaySuzgeci } from "./suzgec";

const S = (ek: Partial<OnaySuzgeci>): OnaySuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("onay süzgeci (spec Ü-25 §3.3)", () => {
  it("varsayılan bekleyen; adres gidiş-dönüş; bekleyen ve ilk sayfa yazılmaz", () => {
    expect(suzgecCoz({}).suzgec).toEqual(BOS_SUZGEC);
    expect(BOS_SUZGEC.durum).toBe("bekleyen");
    expect(onayAdresi(BOS_SUZGEC, { page: 1 })).toBe("/approvals");
    const p = { durum: "RED", baslangic: "2026-11-01", bitis: "2026-11-04", kural: "NEGATIF_STOK", acan: "u-1", q: "SIP-1", detay: "b-1" };
    const { suzgec, detay } = suzgecCoz(p);
    expect(suzgec).toEqual({ durum: "RED", baslangic: "2026-11-01", bitis: "2026-11-04", eski: false, kural: "NEGATIF_STOK", acan: "u-1", q: "SIP-1" });
    expect(detay).toBe("b-1");
    expect(onayAdresi(suzgec, { page: 2, per: 50, detay: "b-1" })).toBe(
      "/approvals?durum=RED&baslangic=2026-11-01&bitis=2026-11-04&kural=NEGATIF_STOK&acan=u-1&q=SIP-1&page=2&per=50&detay=b-1"
    );
  });

  it("geçersiz değer yok sayılır; `eski` durumu ezer (bekleyen)", () => {
    expect(suzgecCoz({ durum: "xyz", kural: "BASKA" }).suzgec).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ eski: "1", durum: "ONAY" }).suzgec).toMatchObject({ eski: true, durum: "bekleyen" });
    expect(suzgecCoz({ eski: "evet" }).suzgec.eski).toBe(false);
    expect(onayAdresi(S({ eski: true }))).toBe("/approvals?eski=1");
  });

  it("sekmeler yalnız durumu yazar, `eski`'yi düşürür, öbürlerini korur", () => {
    const sekmeler = durumSekmeleri(S({ eski: true, kural: "BEDELSIZ_ONAYI" }));
    expect(sekmeler.map((t) => t.etiket)).toEqual(["Bekleyen", "Onaylanan", "Reddedilen", "Tümü"]);
    expect(sekmeler.map((t) => t.adres)).toEqual([
      "/approvals?kural=BEDELSIZ_ONAYI",
      "/approvals?durum=ONAY&kural=BEDELSIZ_ONAYI",
      "/approvals?durum=RED&kural=BEDELSIZ_ONAYI",
      "/approvals?durum=tumu&kural=BEDELSIZ_ONAYI",
    ]);
    expect(sekmeler.find((t) => t.etkin)?.etiket).toBe("Bekleyen");
  });

  it("kart adresleri (A-8-11)", () => {
    expect(kartAdresleri("2026-11-04")).toEqual({
      eski: "/approvals?eski=1",
      bugunOnay: "/approvals?durum=ONAY&baslangic=2026-11-04&bitis=2026-11-04",
      bugunRed: "/approvals?durum=RED&baslangic=2026-11-04&bitis=2026-11-04",
    });
  });

  it("etiketler; bekleyen etiketsiz; bilinmeyen açan etiketsiz; boş durum", () => {
    const s = S({ durum: "ONAY", baslangic: "2026-11-01", bitis: "2026-11-04", kural: "NEGATIF_STOK", acan: "u-1", q: "x" });
    expect(etkinSuzgecler(s, (id) => (id === "u-1" ? "Ayşe" : undefined)).map((e) => e.etiket)).toEqual([
      "Durum: Onaylanan",
      "Tarih: 01.11.2026 – 04.11.2026",
      "Kural: Negatif stok",
      "Açan: Ayşe",
      "Ara: x",
    ]);
    expect(etkinSuzgecler(S({ eski: true }), () => undefined).map((e) => e.etiket)).toEqual(["24 saatten eski"]);
    expect(etkinSuzgecler(S({ acan: "u-2" }), () => undefined)).toEqual([]);
    expect(etkinSuzgecler(BOS_SUZGEC, () => undefined)).toEqual([]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(S({ durum: "RED" }))).toBe("suzgecli");
  });
});
