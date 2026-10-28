import { describe, expect, it } from "vitest";

import {
  BOS_SUZGEC,
  HIZLI_SEKMELER,
  ayniSuzgec,
  bosDurum,
  doktorAdresi,
  etkinSayisi,
  etkinSuzgecler,
  saticiyiDogrula,
  suzgecCoz,
  type DoktorSuzgeci,
} from "@/lib/doktor-listesi/suzgec";

// Cari listesinin süzgeci — KABUL_KRITERLERI X-8-4; spec §3.2.

const DOLU: DoktorSuzgeci = {
  sinif: "DOKTOR",
  bolge: "İç Anadolu",
  satici: "cuid123",
  durum: "PASIF",
  fatura: "eksik",
  sessiz: null,
  sonBas: "2026-10-01",
  sonBit: "2026-10-15",
};

const adresiCoz = (adres: string) => suzgecCoz(Object.fromEntries(new URL(adres, "http://x").searchParams));
const ad = (id: string) => (id === "cuid123" ? "Ahmet Yılmaz" : undefined);

describe("suzgecCoz — geçerli ve geçersiz değerler", () => {
  it("geçerli alanları okur", () => {
    expect(suzgecCoz({ sinif: "BAYI", bolge: " Ege ", satici: "abc", durum: "AKTIF", fatura: "eksik", sessiz: "90" })).toEqual({
      suzgec: { ...BOS_SUZGEC, sinif: "BAYI", bolge: "Ege", satici: "abc", durum: "AKTIF", fatura: "eksik", sessiz: "90" },
      detay: null,
    });
  });

  it("geçersiz değerleri yok sayar", () => {
    const { suzgec, detay } = suzgecCoz({
      sinif: "X",
      durum: "x",
      sessiz: "45",
      sonBas: "2026-02-30",
      satici: "a".repeat(65),
      fatura: "tam",
      bolge: "   ",
      detay: "a b",
    });
    expect(suzgec).toEqual(BOS_SUZGEC);
    expect(detay).toBeNull();
  });

  it("101 karakterlik bölgeyi yok sayar", () => {
    expect(suzgecCoz({ bolge: "b".repeat(101) }).suzgec.bolge).toBeNull();
  });

  it("dizi parametrede ilk değeri alır; detay kimliğini okur", () => {
    expect(suzgecCoz({ sinif: ["BAYI", "DOKTOR"], detay: "cuid9" })).toEqual({
      suzgec: { ...BOS_SUZGEC, sinif: "BAYI" },
      detay: "cuid9",
    });
  });
});

describe("suzgecCoz — geriye uyum (X-8-4)", () => {
  it("?sahip=yok satıcı süzgecine çözülür", () => {
    expect(suzgecCoz({ sahip: "yok" }).suzgec).toEqual({ ...BOS_SUZGEC, satici: "yok" });
  });

  it("?sinif= ve ?fatura=eksik aynen çözülür", () => {
    expect(suzgecCoz({ sinif: "BAYI" }).suzgec).toEqual({ ...BOS_SUZGEC, sinif: "BAYI" });
    expect(suzgecCoz({ fatura: "eksik" }).suzgec).toEqual({ ...BOS_SUZGEC, fatura: "eksik" });
  });
});

describe("suzgecCoz — son sipariş", () => {
  it("aralık varsa hazır seçim yok sayılır", () => {
    const { suzgec } = suzgecCoz({ sessiz: "90", sonBas: "2026-10-01" });
    expect(suzgec.sessiz).toBeNull();
    expect(suzgec.sonBas).toBe("2026-10-01");
  });

  it("ters aralıkta iki uç da yok sayılır", () => {
    const { suzgec } = suzgecCoz({ sonBas: "2026-10-10", sonBit: "2026-10-01" });
    expect(suzgec.sonBas).toBeNull();
    expect(suzgec.sonBit).toBeNull();
  });

  it("tek uç geçerlidir", () => {
    expect(suzgecCoz({ sonBit: "2026-10-01" }).suzgec).toEqual({ ...BOS_SUZGEC, sonBit: "2026-10-01" });
  });
});

describe("doktorAdresi", () => {
  it("boş süzgeç çıplak yoldur", () => {
    expect(doktorAdresi(BOS_SUZGEC)).toBe("/doctors");
  });

  it("gidiş-dönüş aynı süzgeci verir (Türkçe ve boşluklu bölge dahil)", () => {
    expect(adresiCoz(doktorAdresi(DOLU)).suzgec).toEqual(DOLU);
    const hazir = { ...BOS_SUZGEC, satici: "yok", sessiz: "hic" } as const;
    expect(adresiCoz(doktorAdresi(hazir)).suzgec).toEqual(hazir);
  });

  it("eski sahip= parametresini yazmaz", () => {
    expect(doktorAdresi({ ...BOS_SUZGEC, satici: "yok" })).not.toContain("sahip=");
  });

  it("1. sayfayı yazmaz, sonrakini yazar; per korunur", () => {
    expect(doktorAdresi(BOS_SUZGEC, { page: 1 })).toBe("/doctors");
    expect(doktorAdresi(BOS_SUZGEC, { page: 2, per: 50 })).toBe("/doctors?page=2&per=50");
  });

  it("detay yalnız istenince yazılır", () => {
    expect(doktorAdresi(DOLU)).not.toContain("detay=");
    expect(adresiCoz(doktorAdresi(DOLU, { detay: "cuid9" })).detay).toBe("cuid9");
  });
});

describe("etkinSayisi", () => {
  it("boşta 0; her alan bir; aralığın iki ucu tek sayılır", () => {
    expect(etkinSayisi(BOS_SUZGEC)).toBe(0);
    expect(etkinSayisi({ ...BOS_SUZGEC, sinif: "DOKTOR", bolge: "Ege", sessiz: "30" })).toBe(3);
    expect(etkinSayisi({ ...BOS_SUZGEC, sonBas: "2026-10-01", sonBit: "2026-10-15" })).toBe(1);
  });
});

describe("etkinSuzgecler — etiketler ve kaldırma adresleri", () => {
  const etiketler = (s: DoktorSuzgeci) => etkinSuzgecler(s, ad).map((e) => e.etiket);

  it("her alanın etiketi", () => {
    expect(etiketler(DOLU)).toEqual([
      "Sınıf: Doktor",
      "Bölge: İç Anadolu",
      "Satıcı: Ahmet Yılmaz",
      "Durum: Pasif",
      "Eksik fatura bilgisi",
      "Son sipariş: 01.10.2026 – 15.10.2026",
    ]);
    expect(etiketler({ ...BOS_SUZGEC, sinif: "BAYI", satici: "yok", durum: "AKTIF", sessiz: "90" })).toEqual([
      "Sınıf: Bayi",
      "Satıcı: Sahipsiz",
      "Durum: Aktif",
      "Son sipariş: 90+ gün önce",
    ]);
    expect(etiketler({ ...BOS_SUZGEC, sessiz: "hic" })).toEqual(["Son sipariş: hiç yok"]);
    expect(etiketler({ ...BOS_SUZGEC, sonBas: "2026-10-01" })).toEqual(["Son sipariş: 01.10.2026 sonrası"]);
    expect(etiketler({ ...BOS_SUZGEC, sonBit: "2026-10-15" })).toEqual(["Son sipariş: 15.10.2026 öncesi"]);
  });

  it("adı bilinmeyen satıcının etiketi yoktur", () => {
    expect(etiketler({ ...BOS_SUZGEC, satici: "baska" })).toEqual([]);
  });

  it("kaldırma adresi yalnız o alanı düşürür; aralıkta iki uç birlikte", () => {
    for (const e of etkinSuzgecler(DOLU, ad)) {
      const kalan = adresiCoz(e.kaldirAdresi).suzgec;
      const beklenen =
        e.anahtar === "sonBas" ? { ...DOLU, sonBas: null, sonBit: null } : { ...DOLU, [e.anahtar]: null };
      expect(kalan).toEqual(beklenen);
    }
  });
});

describe("HIZLI_SEKMELER ve ayniSuzgec", () => {
  const sekme = (etiket: string) => HIZLI_SEKMELER.find((s) => s.etiket === etiket)!.suzgec;

  it("beş sekme sırayla", () => {
    expect(HIZLI_SEKMELER.map((s) => s.etiket)).toEqual(["Tümü", "Doktorlar", "Bayiler", "Sahipsiz", "Eksik fatura bilgisi"]);
  });

  it("Sahipsiz sekmesi satıcı süzgecidir; eski adres onu etkinleştirir", () => {
    expect(sekme("Sahipsiz")).toEqual({ ...BOS_SUZGEC, satici: "yok" });
    expect(ayniSuzgec(suzgecCoz({ sahip: "yok" }).suzgec, sekme("Sahipsiz"))).toBe(true);
  });

  it("birleşik süzgeçte hiçbir sekme etkin değildir", () => {
    const s = { ...BOS_SUZGEC, sinif: "DOKTOR" as const, bolge: "Ege" };
    expect(HIZLI_SEKMELER.some((h) => ayniSuzgec(s, h.suzgec))).toBe(false);
  });
});

describe("bosDurum", () => {
  it("süzgece göre boş durum türü", () => {
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum({ ...BOS_SUZGEC, satici: "yok" })).toBe("sahipsiz");
    expect(bosDurum({ ...BOS_SUZGEC, fatura: "eksik" })).toBe("eksik-fatura");
    expect(bosDurum({ ...BOS_SUZGEC, fatura: "eksik", bolge: "Ege" })).toBe("suzgecli");
    expect(bosDurum({ ...BOS_SUZGEC, satici: "abc" })).toBe("suzgecli");
  });
});

describe("saticiyiDogrula — bilinmeyen satıcı yok sayılır (spec §5)", () => {
  it("aktif satıcı ve sahipsiz kalır; bilinmeyen düşer", () => {
    const aktif = ["s1", "s2"];
    expect(saticiyiDogrula({ ...BOS_SUZGEC, satici: "s1" }, aktif).satici).toBe("s1");
    expect(saticiyiDogrula({ ...BOS_SUZGEC, satici: "yok" }, aktif).satici).toBe("yok");
    expect(saticiyiDogrula({ ...BOS_SUZGEC, satici: "pasif", bolge: "Ege" }, aktif)).toEqual({ ...BOS_SUZGEC, bolge: "Ege" });
  });
});
