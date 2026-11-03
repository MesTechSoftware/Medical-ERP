import { describe, expect, it } from "vitest";
import {
  BOS_SUZGEC,
  bosDurum,
  dagilimAdresi,
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
    const p = { durum: "TEKLIF", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "u-1", q: "SIP-1", detay: "o-1" };
    const { suzgec, detay } = suzgecCoz(p);
    expect(suzgec).toEqual({ durum: "TEKLIF", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "u-1", q: "SIP-1" });
    expect(detay).toBe("o-1");
    expect(siparisAdresi(suzgec, { page: 2, per: 50, detay: "o-1" })).toBe(
      "/orders?durum=TEKLIF&baslangic=2026-10-01&bitis=2026-10-15&satici=u-1&q=SIP-1&page=2&per=50&detay=o-1"
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
    expect(sekmeler.map((t) => t.etiket)).toEqual(["Tümü", "Bekliyor", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal", "Teklif"]);
    expect(sekmeler.find((t) => t.etkin)?.etiket).toBe("İptal");
    expect(sekmeler[0].adres).toBe("/orders?satici=u-1&q=x");
    expect(sekmeler[6].adres).toBe("/orders?durum=TEKLIF&satici=u-1&q=x");
    expect(hizliSekmeler(BOS_SUZGEC)[0].etkin).toBe(true);
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

  it("kart adresi kullandığı aralığı yazar", () => {
    expect(kartAdresi("BEKLIYOR", { baslangic: "2026-11-01", bitis: "2026-11-03" })).toBe(
      "/orders?durum=BEKLIYOR&baslangic=2026-11-01&bitis=2026-11-03"
    );
  });
});

describe("etkin süzgeç etiketleri ve boş durum", () => {
  it("etiketler, her biri kendi alanını düşüren adresle", () => {
    const s = S({ durum: "TEKLIF", baslangic: "2026-10-01", bitis: "2026-10-15", satici: "yok", q: "SIP-1" });
    expect(etkinSuzgecler(s, () => undefined)).toEqual([
      { anahtar: "durum", etiket: "Durum: Teklif", kaldirAdresi: "/orders?baslangic=2026-10-01&bitis=2026-10-15&satici=yok&q=SIP-1" },
      { anahtar: "tarih", etiket: "Tarih: 01.10.2026 – 15.10.2026", kaldirAdresi: "/orders?durum=TEKLIF&satici=yok&q=SIP-1" },
      { anahtar: "satici", etiket: "Satıcı: Satıcısız (bayi)", kaldirAdresi: "/orders?durum=TEKLIF&baslangic=2026-10-01&bitis=2026-10-15&q=SIP-1" },
      { anahtar: "q", etiket: "Ara: SIP-1", kaldirAdresi: "/orders?durum=TEKLIF&baslangic=2026-10-01&bitis=2026-10-15&satici=yok" },
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
