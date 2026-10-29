import { describe, expect, it } from "vitest";

import {
  BOS_SUZGEC,
  HIZLI_SEKMELER,
  bosDurum,
  etkinSuzgecler,
  suzgecCoz,
  urunAdresi,
  type UrunSuzgeci,
} from "@/lib/urun-listesi/suzgec";
import { SUTUNLAR, SUTUN_CEREZI, SUTUN_YOLU } from "@/lib/urun-listesi/sutunlar";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";

// Ürün listesinin süzgeci ve sütunları — spec Ü-19 §3.2–3.4, §4.3.

const params = (adres: string) => Object.fromEntries(new URL(adres, "http://x").searchParams);

describe("suzgecCoz ↔ urunAdresi", () => {
  it("her durum × stok birleşimi gidiş-dönüşte korunur", () => {
    for (const durum of [null, "AKTIF", "PASIF"] as const) {
      for (const stok of [null, "kritik", "tukendi"] as const) {
        const s: UrunSuzgeci = { durum, stok };
        expect(suzgecCoz(params(urunAdresi(s))).suzgec).toEqual(s);
      }
    }
  });

  it("geçersiz değerler yok sayılır", () => {
    expect(suzgecCoz({ durum: "SILINDI", stok: "az", detay: "<script>" })).toEqual({ suzgec: BOS_SUZGEC, detay: null });
  });

  it("dizi değerde ilki alınır", () => {
    expect(suzgecCoz({ durum: ["PASIF", "AKTIF"] }).suzgec.durum).toBe("PASIF");
  });

  it("adres sabit sırada; ilk sayfa yazılmaz; detay korunur", () => {
    expect(urunAdresi(BOS_SUZGEC)).toBe("/products");
    expect(urunAdresi({ durum: "AKTIF", stok: "kritik" }, { page: 2, detay: "abc" })).toBe(
      "/products?durum=AKTIF&stok=kritik&page=2&detay=abc"
    );
    expect(urunAdresi(BOS_SUZGEC, { page: 1, per: 50 })).toBe("/products?per=50");
    expect(suzgecCoz(params("/products?stok=tukendi&detay=abc")).detay).toBe("abc");
  });
});

describe("etkinSuzgecler", () => {
  it("her etkin alan bir etiket; kaldırma adresi diğerini korur", () => {
    const e = etkinSuzgecler({ durum: "AKTIF", stok: "kritik" });
    expect(e.map((x) => x.etiket)).toEqual(["Durum: Aktif", "Stok: Kritik"]);
    expect(e[0].kaldirAdresi).toBe("/products?stok=kritik");
    expect(e[1].kaldirAdresi).toBe("/products?durum=AKTIF");
    expect(etkinSuzgecler({ durum: "PASIF", stok: "tukendi" }).map((x) => x.etiket)).toEqual([
      "Durum: Pasif",
      "Stok: Tükendi",
    ]);
    expect(etkinSuzgecler(BOS_SUZGEC)).toEqual([]);
  });
});

describe("bosDurum", () => {
  it("süzgece göre boş durum türü", () => {
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum({ durum: null, stok: "kritik" })).toBe("kritik");
    expect(bosDurum({ durum: null, stok: "tukendi" })).toBe("tukendi");
    expect(bosDurum({ durum: "AKTIF", stok: "kritik" })).toBe("suzgecli");
    expect(bosDurum({ durum: "PASIF", stok: null })).toBe("suzgecli");
  });
});

describe("HIZLI_SEKMELER", () => {
  it("Tümü · Aktif · Pasif · Kritik stok · Tükendi", () => {
    expect(HIZLI_SEKMELER.map((s) => [s.etiket, urunAdresi(s.suzgec)])).toEqual([
      ["Tümü", "/products"],
      ["Aktif", "/products?durum=AKTIF"],
      ["Pasif", "/products?durum=PASIF"],
      ["Kritik stok", "/products?stok=kritik"],
      ["Tükendi", "/products?stok=tukendi"],
    ]);
  });
});

describe("SUTUNLAR", () => {
  it("tablo sırası; KDV dahil varsayılan gizli; Ürün ve İşlem gizlenemez", () => {
    expect(SUTUNLAR.map((s) => s.anahtar)).toEqual(["kod", "fiyat", "fiyatKdvDahil", "kdv", "stok", "durum"]);
    expect([...gizliSutunlariCoz(SUTUNLAR, undefined)]).toEqual(["fiyatKdvDahil"]);
    expect(SUTUN_CEREZI).toBe("urun-sutunlar");
    expect(SUTUN_YOLU).toBe("/products");
  });
});
