import { describe, expect, it } from "vitest";

import {
  BOS_SUZGEC,
  bosDurum,
  etkinSekme,
  etkinSuzgecler,
  hizliSekmeler,
  sekmeAdresi,
  stokAdresi,
  suzgecCoz,
  urunuDogrula,
  type StokSuzgeci,
} from "@/lib/stok-listesi/suzgec";

// Stok ekranının süzgeci — spec Ü-20 §3.3; ürün süzgeci KABUL_KRITERLERI B-4-12.

const parametreler = (adres: string) => Object.fromEntries(new URL(adres, "http://x").searchParams);

describe("suzgecCoz / stokAdresi", () => {
  it("gidiş-dönüş", () => {
    const s: StokSuzgeci = { baslangic: "2026-10-01", bitis: "2026-10-31", tur: "sevkiyat", yon: "CIKIS", urunId: "cm1" };
    expect(stokAdresi(s)).toBe("/stock?baslangic=2026-10-01&bitis=2026-10-31&tur=sevkiyat&yon=CIKIS&urunId=cm1");
    expect(suzgecCoz(parametreler(stokAdresi(s)))).toEqual(s);
    expect(stokAdresi(BOS_SUZGEC)).toBe("/stock");
  });

  it("geçersiz tür, yön ve tarih yok sayılır", () => {
    expect(suzgecCoz({ tur: "x", yon: "giris", baslangic: "2026-02-30", bitis: "dün" })).toEqual(BOS_SUZGEC);
    expect(suzgecCoz({ urunId: "a b;" })).toEqual(BOS_SUZGEC);
  });

  it("bitiş başlangıçtan önceyse yer değiştirir; tek uç korunur", () => {
    expect(suzgecCoz({ baslangic: "2026-10-31", bitis: "2026-10-01" })).toMatchObject({ baslangic: "2026-10-01", bitis: "2026-10-31" });
    expect(suzgecCoz({ bitis: "2026-10-01" })).toMatchObject({ baslangic: null, bitis: "2026-10-01" });
  });

  it("urun (form önseçimi) süzgeç değildir; urunId süzgeçtir; sayfa ve sayfa boyu eklenir", () => {
    expect(suzgecCoz({ urun: "cm1", yon: "GIRIS" })).toEqual({ ...BOS_SUZGEC, yon: "GIRIS" });
    expect(suzgecCoz({ urunId: "cm1" })).toEqual({ ...BOS_SUZGEC, urunId: "cm1" });
    expect(stokAdresi({ ...BOS_SUZGEC, yon: "GIRIS" }, { page: 3, per: 50 })).toBe("/stock?yon=GIRIS&page=3&per=50");
    expect(stokAdresi(BOS_SUZGEC, { page: 1 })).toBe("/stock");
  });
});

describe("hızlı sekmeler", () => {
  it("Bugün, son 7 gün, bu ay — verilen güne göre", () => {
    expect(hizliSekmeler("2026-11-01")).toEqual([
      { etiket: "Tümü", tarih: { baslangic: null, bitis: null } },
      { etiket: "Bugün", tarih: { baslangic: "2026-11-01", bitis: "2026-11-01" } },
      { etiket: "Son 7 gün", tarih: { baslangic: "2026-10-26", bitis: "2026-11-01" } },
      { etiket: "Bu ay", tarih: { baslangic: "2026-11-01", bitis: "2026-11-01" } },
    ]);
    expect(hizliSekmeler("2026-03-03")[2].tarih.baslangic).toBe("2026-02-25");
    expect(hizliSekmeler("2026-03-03")[3].tarih.baslangic).toBe("2026-03-01");
  });

  it("ayın 1'inde Bugün ile Bu ay aynı aralıktadır; yalnız ilk uyan sekme etkindir", () => {
    const sekmeler = hizliSekmeler("2026-11-01");
    expect(etkinSekme(sekmeler, { ...BOS_SUZGEC, baslangic: "2026-11-01", bitis: "2026-11-01" })).toBe("Bugün");
    expect(etkinSekme(sekmeler, BOS_SUZGEC)).toBe("Tümü");
    expect(etkinSekme(hizliSekmeler("2026-11-15"), { ...BOS_SUZGEC, baslangic: "2026-11-01", bitis: "2026-11-15" })).toBe("Bu ay");
    expect(etkinSekme(sekmeler, { ...BOS_SUZGEC, baslangic: "2026-10-01", bitis: "2026-10-31" })).toBeNull();
  });

  it("sekme adresi tarihleri yazar, tür, yön ve ürünü korur, sayfayı düşürür", () => {
    const s: StokSuzgeci = { baslangic: "2026-01-01", bitis: "2026-01-02", tur: "sevkiyat", yon: "CIKIS", urunId: "cm1" };
    expect(sekmeAdresi(s, { baslangic: "2026-11-01", bitis: "2026-11-01" })).toBe(
      "/stock?baslangic=2026-11-01&bitis=2026-11-01&tur=sevkiyat&yon=CIKIS&urunId=cm1"
    );
    expect(sekmeAdresi(s, { baslangic: null, bitis: null })).toBe("/stock?tur=sevkiyat&yon=CIKIS&urunId=cm1");
  });
});

describe("etkin süzgeçler ve boş durum", () => {
  const urunAdi = (id: string) => (id === "cm1" ? "Vida (VD-1)" : undefined);

  it("etiket metinleri; kaldırma adresi yalnız kendi parametresini düşürür", () => {
    const s: StokSuzgeci = { baslangic: "2026-11-01", bitis: "2026-11-01", tur: "duzeltme", yon: "GIRIS", urunId: "cm1" };
    expect(etkinSuzgecler(s, urunAdi)).toEqual([
      { anahtar: "tarih", etiket: "Tarih: 01.11.2026 – 01.11.2026", kaldirAdresi: "/stock?tur=duzeltme&yon=GIRIS&urunId=cm1" },
      { anahtar: "tur", etiket: "Tür: Düzeltme", kaldirAdresi: "/stock?baslangic=2026-11-01&bitis=2026-11-01&yon=GIRIS&urunId=cm1" },
      { anahtar: "yon", etiket: "Yön: Giriş", kaldirAdresi: "/stock?baslangic=2026-11-01&bitis=2026-11-01&tur=duzeltme&urunId=cm1" },
      { anahtar: "urun", etiket: "Ürün: Vida (VD-1)", kaldirAdresi: "/stock?baslangic=2026-11-01&bitis=2026-11-01&tur=duzeltme&yon=GIRIS" },
    ]);
  });

  it("tek uçlu tarih etiketi", () => {
    expect(etkinSuzgecler({ ...BOS_SUZGEC, baslangic: "2026-11-01" }, urunAdi)[0].etiket).toBe("Tarih: 01.11.2026 sonrası");
    expect(etkinSuzgecler({ ...BOS_SUZGEC, bitis: "2026-11-01" }, urunAdi)[0].etiket).toBe("Tarih: 01.11.2026 öncesi");
    expect(etkinSuzgecler({ ...BOS_SUZGEC, yon: "CIKIS" }, urunAdi)[0].etiket).toBe("Yön: Çıkış");
  });

  it("urunuDogrula: seçeneklerde olmayan ürün düşer, öbür süzgeçler kalır", () => {
    expect(urunuDogrula({ ...BOS_SUZGEC, urunId: "cm1" }, ["cm1"]).urunId).toBe("cm1");
    expect(urunuDogrula({ ...BOS_SUZGEC, urunId: "yok", yon: "GIRIS" }, ["cm1"])).toEqual({ ...BOS_SUZGEC, yon: "GIRIS" });
    expect(urunuDogrula(BOS_SUZGEC, [])).toEqual(BOS_SUZGEC);
  });

  it("boş durum türü", () => {
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum({ ...BOS_SUZGEC, tur: "iade" })).toBe("suzgecli");
    expect(bosDurum({ ...BOS_SUZGEC, urunId: "cm1" })).toBe("suzgecli");
  });
});
