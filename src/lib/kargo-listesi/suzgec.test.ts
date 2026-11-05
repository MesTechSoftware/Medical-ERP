import { describe, expect, it } from "vitest";
import {
  BOS_SUZGEC,
  bosDurum,
  etkinSekme,
  etkinSuzgecler,
  hizliSekmeler,
  kargoAdresi,
  kismiSonrasiAdres,
  sekmeAdresi,
  suzgecCoz,
  topluSecimCoz,
  tumunuSecDurumu,
  TOPLU_SINIR,
  type KargoSuzgeci,
} from "./suzgec";

const S = (ek: Partial<KargoSuzgeci>): KargoSuzgeci => ({ ...BOS_SUZGEC, ...ek });

describe("sevkiyat listesi süzgeci (spec Ü-24 §3.5)", () => {
  it("çözme ve adres gidiş-dönüş; ilk sayfa yazılmaz", () => {
    const p = { baslangic: "2026-11-01", bitis: "2026-11-03", firma: "c-1", durum: "KARGOLANDI", q: "TR1", kismi: "o-1" };
    const { suzgec, kismi } = suzgecCoz(p);
    expect(suzgec).toEqual({ baslangic: "2026-11-01", bitis: "2026-11-03", firma: "c-1", durum: "KARGOLANDI", q: "TR1" });
    expect(kismi).toBe("o-1");
    expect(kargoAdresi(suzgec, { page: 2, per: 50, kismi: "o-1" })).toBe(
      "/shipping?baslangic=2026-11-01&bitis=2026-11-03&firma=c-1&durum=KARGOLANDI&q=TR1&page=2&per=50&kismi=o-1"
    );
    expect(kargoAdresi(BOS_SUZGEC, { page: 1 })).toBe("/shipping");
  });

  it("ters gün yer değiştirir; geçersiz durum ve bozuk kimlik yok sayılır; firmasız `yok`", () => {
    expect(suzgecCoz({ baslangic: "2026-11-03", bitis: "2026-11-01" }).suzgec).toMatchObject({ baslangic: "2026-11-01", bitis: "2026-11-03" });
    expect(suzgecCoz({ durum: "IPTAL" }).suzgec.durum).toBeNull();
    expect(suzgecCoz({ firma: "a b" }).suzgec.firma).toBeNull();
    expect(suzgecCoz({ firma: "yok" }).suzgec.firma).toBe("yok");
    expect(suzgecCoz({ q: "  " }).suzgec.q).toBeNull();
    expect(suzgecCoz({ q: "x".repeat(120) }).suzgec.q).toHaveLength(100);
  });

  it("tarih sekmeleri; sekme adresi öbür süzgeçleri korur, sayfa düşer", () => {
    const sekmeler = hizliSekmeler("2026-11-03");
    expect(sekmeler.map((t) => t.etiket)).toEqual(["Tümü", "Bugün", "Son 7 gün", "Bu ay"]);
    expect(sekmeler[1].tarih).toEqual({ baslangic: "2026-11-03", bitis: "2026-11-03" });
    expect(sekmeler[2].tarih).toEqual({ baslangic: "2026-10-28", bitis: "2026-11-03" });
    expect(etkinSekme(sekmeler, S({ baslangic: "2026-11-03", bitis: "2026-11-03" }))).toBe("Bugün");
    expect(sekmeAdresi(S({ firma: "c-1" }), sekmeler[1].tarih)).toBe("/shipping?baslangic=2026-11-03&bitis=2026-11-03&firma=c-1");
  });

  it("etkin etiketler; bilinmeyen firma etiketlenmez", () => {
    const s = S({ baslangic: "2026-11-01", bitis: "2026-11-03", firma: "yok", durum: "TESLIM_EDILDI", q: "TR1" });
    expect(etkinSuzgecler(s, () => undefined).map((e) => e.etiket)).toEqual([
      "Tarih: 01.11.2026 – 03.11.2026",
      "Firma: Firmasız",
      "Durum: Teslim Edildi",
      "Ara: TR1",
    ]);
    expect(etkinSuzgecler(S({ firma: "c-1" }), (id) => (id === "c-1" ? "Yurtiçi" : undefined))[0]).toEqual({
      anahtar: "firma",
      etiket: "Firma: Yurtiçi",
      kaldirAdresi: "/shipping",
    });
    expect(etkinSuzgecler(S({ firma: "c-2" }), () => undefined)).toEqual([]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(S({ durum: "KARGOLANDI" }))).toBe("suzgecli");
  });
});

describe("toplu kargo seçimi (A-3-3)", () => {
  const form = (alanlar: [string, string][]) => {
    const f = new FormData();
    for (const [a, d] of alanlar) f.append(a, d);
    return f;
  };

  it("seçimsiz gönderim hata", () => {
    expect(topluSecimCoz(form([["carrierId", "c-1"]]))).toEqual({ hata: "SECIM_YOK" });
  });

  it("satır başına takip ve irsaliye; kırpılır, boşsa null, irsaliye 32 karakter", () => {
    const r = topluSecimCoz(
      form([
        ["secili", "o-1"],
        ["secili", "o-2"],
        ["takip_o-1", "  TR1 "],
        ["takip_o-2", ""],
        ["irsaliye_o-1", "A".repeat(40)],
      ])
    );
    expect(r).toEqual({
      secimler: [
        { siparisId: "o-1", takip: "TR1", irsaliye: "A".repeat(32) },
        { siparisId: "o-2", takip: null, irsaliye: null },
      ],
    });
  });

  it("tekrar eden seçim bir kez; bozuk kimlik düşer", () => {
    const r = topluSecimCoz(form([["secili", "o-1"], ["secili", "o-1"], ["secili", "a b"]]));
    expect(r).toEqual({ secimler: [{ siparisId: "o-1", takip: null, irsaliye: null }] });
  });

  it(`en çok ${TOPLU_SINIR} sipariş`, () => {
    const alanlar = Array.from({ length: TOPLU_SINIR + 1 }, (_, i): [string, string] => ["secili", `o-${i}`]);
    expect(topluSecimCoz(form(alanlar))).toEqual({ hata: "SINIR_ASILDI" });
    expect("secimler" in topluSecimCoz(form(alanlar.slice(0, TOPLU_SINIR)))).toBe(true);
  });
});

describe("Tümünü seç (toplu sınır)", () => {
  it("hepsi seçili değilse ilk TOPLU_SINIR kutuyu seçer, gerisini bırakır; hepsi seçiliyse temizler", () => {
    expect(tumunuSecDurumu([false, true, false], 2)).toEqual([true, true, false]);
    expect(tumunuSecDurumu(Array(TOPLU_SINIR + 5).fill(false))).toEqual([...Array(TOPLU_SINIR).fill(true), ...Array(5).fill(false)]);
    expect(tumunuSecDurumu([true, true], 2)).toEqual([false, false]);
    expect(tumunuSecDurumu([true, true, false], 2)).toEqual([false, false, false]);
  });
});

describe("kismiSonrasiAdres — kısmi sevkten sonra liste süzgeci korunur (Ü-35)", () => {
  it("kalan varsa panel açık, süzgeç ve sayfa korunur", () => {
    expect(kismiSonrasiAdres("/shipping?firma=f1&page=2", "s1", false)).toBe("/shipping?firma=f1&page=2&kismi=s1");
  });

  it("tamamlandıysa panel düşer", () => {
    expect(kismiSonrasiAdres("/shipping?q=ali&kismi=s1", "s1", true)).toBe("/shipping?q=ali");
  });

  it("başka adres listeye düşer (açık yönlendirme yok)", () => {
    for (const kotu of ["", "https://kotu.example", "//kotu.example", "/orders", "/shippingx"]) {
      expect(kismiSonrasiAdres(kotu, "s1", true)).toBe("/shipping");
    }
  });
});
