import { describe, expect, it } from "vitest";
import {
  BOS_SUZGEC,
  bosDurum,
  dagilimAdresi,
  donemEtiketi,
  etkinSuzgecler,
  hizliSekmeler,
  kartAdresi,
  kpiAraligi,
  siparisAdresi,
  suzgecCoz,
  type SiparisSuzgeci,
} from "./suzgec";

const S = (ek: Partial<SiparisSuzgeci>): SiparisSuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("sipariş süzgeci (spec Ü-23 §3.3)", () => {
  it("çözme ve adres gidiş-dönüş; ilk sayfa yazılmaz", () => {
    const p = { durum: "KARGOLANDI", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "u-1", q: "SIP-1", detay: "o-1" };
    const { suzgec, detay } = suzgecCoz(p);
    expect(suzgec).toEqual({ durum: "KARGOLANDI", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "u-1", q: "SIP-1" });
    expect(detay).toBe("o-1");
    expect(siparisAdresi(suzgec, { page: 2, per: 50, detay: "o-1" })).toBe(
      "/orders?durum=KARGOLANDI&baslangic=2026-10-01&bitis=2026-10-15&satici=u-1&q=SIP-1&page=2&per=50&detay=o-1"
    );
    expect(siparisAdresi(BOS_SUZGEC, { page: 1 })).toBe("/orders");
  });

  it("eski `status` adresi `durum` gibi okunur; `durum` önceliklidir; bozuk değer yok sayılır", () => {
    expect(suzgecCoz({ status: "KARGOLANDI" }).suzgec.durum).toBe("KARGOLANDI");
    expect(suzgecCoz({ status: "IPTAL", durum: "BEKLIYOR" }).suzgec.durum).toBe("BEKLIYOR");
    expect(suzgecCoz({ status: "xyz" }).suzgec.durum).toBeNull();
    expect(suzgecCoz({ durum: "bekliyor" }).suzgec.durum).toBeNull();
  });

  it("ters gün aralığı yer değiştirir; takvimde olmayan gün yok sayılır", () => {
    expect(suzgecCoz({ baslangic: "2026-10-15", bitis: "2026-10-01" }).suzgec).toMatchObject({ baslangic: "2026-10-01", bitis: "2026-10-15" });
    expect(suzgecCoz({ baslangic: "2026-02-30" }).suzgec.baslangic).toBeNull();
  });

  it("metin kırpılır, 100 karaktere kesilir; boşsa yok", () => {
    expect(suzgecCoz({ q: "  SIP-1  " }).suzgec.q).toBe("SIP-1");
    expect(suzgecCoz({ q: "a".repeat(101) }).suzgec.q).toBe("a".repeat(100));
    expect(suzgecCoz({ q: "   " }).suzgec.q).toBeNull();
  });

  it("satıcı: kimlik ya da `yok`; başka biçim yok sayılır", () => {
    expect(suzgecCoz({ satici: "yok" }).suzgec.satici).toBe("yok");
    expect(suzgecCoz({ satici: "a b" }).suzgec.satici).toBeNull();
  });

  it("sekmeler yalnız durumu yazar, öbür süzgeçleri korur, sayfa düşer", () => {
    const s = S({ durum: "IPTAL", satici: "u-1", q: "x" });
    const sekmeler = hizliSekmeler(s);
    expect(sekmeler.map((t) => t.etiket)).toEqual(["Tümü", "Bekliyor", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal"]);
    expect(sekmeler).toHaveLength(6); // B-6: Teklif sekmesi yok; teklifler yalnız Tümü'de
    expect(sekmeler.find((t) => t.etkin)?.etiket).toBe("İptal");
    expect(sekmeler[0].adres).toBe("/orders?satici=u-1&q=x");
    expect(sekmeler[5].adres).toBe("/orders?durum=IPTAL&satici=u-1&q=x");
    expect(hizliSekmeler(BOS_SUZGEC)[0].etkin).toBe(true);
    expect(sekmeler.every((t) => t.sayi === undefined)).toBe(true);
  });

  it("sayılar verilirse her sekme kendi sayısını taşır; Tümü teklif dahil toplamdır (A-5-8)", () => {
    const sayilar = { tumu: 9, BEKLIYOR: 4, HAZIRLANIYOR: 1, KARGOLANDI: 2, TESLIM_EDILDI: 1, IPTAL: 0 };
    expect(hizliSekmeler(BOS_SUZGEC, "/orders", sayilar).map((t) => [t.etiket, t.sayi])).toEqual([
      ["Tümü", 9], ["Bekliyor", 4], ["Hazırlanıyor", 1], ["Kargolandı", 2], ["Teslim Edildi", 1], ["İptal", 0],
    ]);
  });

  it("dönem etiketi: tarih süzgeci varsa aralık, yoksa Tüm zamanlar", () => {
    expect(donemEtiketi(BOS_SUZGEC)).toBe("Tüm zamanlar");
    expect(donemEtiketi(S({ baslangic: "2026-11-01", bitis: "2026-11-05" }))).toContain("2026");
  });
});

describe("KPI aralığı ve kart adresi (A-5-8)", () => {
  it("tarih süzgeci yoksa bu ay: ayın 1'i – bugün", () => {
    expect(kpiAraligi(BOS_SUZGEC, "2026-11-03")).toEqual({ baslangic: "2026-11-01", bitis: "2026-11-03", varsayilan: true });
  });

  it("tarih süzgeci varsa onu verir; tek uç açık kalır", () => {
    expect(kpiAraligi(S({ baslangic: "2026-10-01", bitis: "2026-10-15" }), "2026-11-03")).toEqual({
      baslangic: "2026-10-01",
      bitis: "2026-10-15",
      varsayilan: false,
    });
    expect(kpiAraligi(S({ baslangic: "2026-10-01" }), "2026-11-03")).toEqual({ baslangic: "2026-10-01", bitis: null, varsayilan: false });
  });

  it("metin ve satıcı süzgeci aralığı değiştirmez", () => {
    expect(kpiAraligi(S({ satici: "u-1", q: "x", durum: "IPTAL" }), "2026-11-03").varsayilan).toBe(true);
  });

  it("dashboard dağılım dilimi aralığın İstanbul günlerini yazar; bitiş dışlayıcıdır (son gün dahil yazılır)", () => {
    // 1 Kasım 00:00 İstanbul = 31.10 21:00 UTC; [1 Kasım, 4 Kasım) → 01–03 Kasım.
    const aralik = { baslangic: new Date("2026-10-31T21:00:00Z"), bitis: new Date("2026-11-03T21:00:00Z") };
    expect(dagilimAdresi("IPTAL", aralik)).toBe("/orders?durum=IPTAL&baslangic=2026-11-01&bitis=2026-11-03");
  });

  it("dashboard aralığı gece yarısında sıfır uzunluktaysa tek gün yazılır (bitiş başlangıçtan önce düşmez)", () => {
    const an = new Date("2026-11-02T21:00:00Z"); // 3 Kasım 00:00 İstanbul
    expect(dagilimAdresi("BEKLIYOR", { baslangic: an, bitis: an })).toBe("/orders?durum=BEKLIYOR&baslangic=2026-11-03&bitis=2026-11-03");
  });

  it("kart adresi kullandığı aralığı yazar", () => {
    expect(kartAdresi("BEKLIYOR", { baslangic: "2026-11-01", bitis: "2026-11-03" })).toBe(
      "/orders?durum=BEKLIYOR&baslangic=2026-11-01&bitis=2026-11-03"
    );
  });
});

describe("etkin süzgeç etiketleri ve boş durum", () => {
  it("etiketler, her biri kendi alanını düşüren adresle", () => {
    const s = S({ durum: "KARGOLANDI", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "yok", q: "SIP-1" });
    expect(etkinSuzgecler(s, () => undefined)).toEqual([
      { anahtar: "durum", etiket: "Durum: Kargolandı", kaldirAdresi: "/orders?baslangic=2026-10-01&bitis=2026-10-15&satici=yok&q=SIP-1" },
      { anahtar: "tarih", etiket: "Tarih: 01.10.2026 – 15.10.2026", kaldirAdresi: "/orders?durum=KARGOLANDI&satici=yok&q=SIP-1" },
      { anahtar: "satici", etiket: "Satıcı: Satıcısız (bayi)", kaldirAdresi: "/orders?durum=KARGOLANDI&baslangic=2026-10-01&bitis=2026-10-15&q=SIP-1" },
      { anahtar: "q", etiket: "Ara: SIP-1", kaldirAdresi: "/orders?durum=KARGOLANDI&baslangic=2026-10-01&bitis=2026-10-15&satici=yok" },
    ]);
  });

  it("satıcı adı bilinirse yazılır; bilinmeyen satıcının etiketi çıkmaz", () => {
    expect(etkinSuzgecler(S({ satici: "u-1" }), (id) => (id === "u-1" ? "Ayşe" : undefined))[0].etiket).toBe("Satıcı: Ayşe");
    expect(etkinSuzgecler(S({ satici: "u-2" }), () => undefined)).toEqual([]);
  });

  it("boş durum türü", () => {
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(S({ q: "x" }))).toBe("suzgecli");
  });
});

describe("Siparişlerim yolu (Ü-31)", () => {
  it("adres, sekmeler, kart ve etiketler `/my-orders`'ı yazar; varsayılan `/orders` kalır", () => {
    const s = S({ durum: "BEKLIYOR", q: "x" });
    expect(siparisAdresi(s, { page: 2, detay: "o-1" }, "/my-orders")).toBe("/my-orders?durum=BEKLIYOR&q=x&page=2&detay=o-1");
    expect(siparisAdresi(BOS_SUZGEC, {}, "/my-orders")).toBe("/my-orders");
    expect(hizliSekmeler(s, "/my-orders")[0].adres).toBe("/my-orders?q=x");
    expect(kartAdresi("KARGOLANDI", { baslangic: "2026-11-01", bitis: "2026-11-05" }, "/my-orders")).toBe(
      "/my-orders?durum=KARGOLANDI&baslangic=2026-11-01&bitis=2026-11-05"
    );
    expect(etkinSuzgecler(s, () => undefined, "/my-orders").map((e) => e.kaldirAdresi)).toEqual(["/my-orders?q=x", "/my-orders?durum=BEKLIYOR"]);
    expect(siparisAdresi(s)).toBe("/orders?durum=BEKLIYOR&q=x");
  });
});

