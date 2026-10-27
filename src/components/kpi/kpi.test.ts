import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { KpiSatiriIskeleti } from "@/components/Iskelet";
import { KpiCard, degisimTonu, kpiAltNotu, type KpiCardProps } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import { MATRAH } from "@/lib/taban";

const kart = (p: Partial<KpiCardProps> & Record<string, unknown>) =>
  renderToStaticMarkup(
    createElement(KpiCard, {
      etiket: "Ciro",
      varyant: "birincil",
      iyiYon: "yukari-iyi",
      bosDavranisi: "sifir",
      tutar: "1200",
      taban: MATRAH,
      ...p,
    } as KpiCardProps)
  );

describe("degisimTonu — iyi yön", () => {
  it("iyi yön olumlu, kötü yön uyarı (hata değil), eşit ve nötr KPI nötr", () => {
    expect(degisimTonu("artis", "yukari-iyi")).toBe("olumlu");
    expect(degisimTonu("azalis", "yukari-iyi")).toBe("uyari");
    expect(degisimTonu("artis", "asagi-iyi")).toBe("uyari");
    expect(degisimTonu("azalis", "asagi-iyi")).toBe("olumlu");
    expect(degisimTonu("esit", "yukari-iyi")).toBe("notr");
    expect(degisimTonu("artis", "notr")).toBe("notr");
  });
});

describe("KpiCard", () => {
  it("para değeri <Tutar> ile, taban etiketi görünür; kart rol grubu", () => {
    const h = kart({});
    expect(h).toContain('role="group"');
    expect(h).toContain('aria-label="Ciro"');
    expect(h).toContain("₺1.200,00");
    expect(h).toContain('data-taban="KDV_HARIC"');
  });

  it("değer kart genişliğine göre küçülür, tek satırdır; taban etiketi kendi satırında", () => {
    const h = kart({});
    expect(h).toContain("@container");
    expect(h).toContain("whitespace-nowrap");
    expect(h).toContain("13cqi");
    expect(h).toContain("[&amp;_[data-taban]]:block");
  });

  it("değişim: ok + yönün adı (ekran okuyucuya) + mutlak yüzde; not alt satırda; kötü yön uyarı tonunda", () => {
    const artis = kart({ karsilastirma: { onceki: "1000", not: "geçen aya göre" }, donemNotu: "Bu ay" });
    expect(artis).toMatch(/text-positive[^>]*data-yon="artis"/);
    expect(artis).toContain('<span class="sr-only">artış</span>');
    expect(artis).toContain("%20");
    expect(artis).toMatch(/mt-auto[^>]*>Bu ay · geçen aya göre<\/p>/);
    const azalis = kart({ tutar: "800", karsilastirma: { onceki: "1000", not: "geçen aya göre" } });
    expect(azalis).toMatch(/text-critical[^>]*data-yon="azalis"/);
    expect(azalis).toContain('<span class="sr-only">azalış</span>');
    expect(azalis).toContain("%20");
    expect(azalis).not.toContain("text-negative");
  });

  it("taban 0 ise 'yeni'; negatif tabanda yüzde yok ama yön var", () => {
    expect(kart({ karsilastirma: { onceki: "0", not: "geçen aya göre" } })).toContain("yeni");
    const negatif = kart({ karsilastirma: { onceki: "-50", not: "geçen aya göre" } });
    expect(negatif).toContain('data-yon="artis"');
    expect(negatif).not.toContain("%");
  });

  it("karşılaştırma yoksa ya da yapılamıyorsa not yazılmaz; dönem notu kalır", () => {
    const yok = kart({ tutar: null, bosDavranisi: "veri-yok", donemNotu: "Bu ay", karsilastirma: { onceki: "5", not: "geçen aya göre" } });
    expect(yok).not.toContain("göre");
    expect(yok).toContain("Bu ay");
    expect(kpiAltNotu(undefined, "önceki aya göre")).toBe("önceki aya göre");
    expect(kpiAltNotu("Bu ay", undefined)).toBe("Bu ay");
  });

  it("boş davranışı: 'sifir' gerçek sıfır gösterir, 'veri-yok' Veri yok yazar", () => {
    expect(kart({ tutar: null, bosDavranisi: "sifir" })).toContain("₺0,00");
    const yok = kart({ tutar: null, bosDavranisi: "veri-yok" });
    expect(yok).toContain("Veri yok");
    expect(yok).not.toContain("₺");
  });

  it("adet KPI'sı binlik ayırıcıyla; anlık not; hata yalnız bu kartı düşürür", () => {
    const adet = renderToStaticMarkup(
      createElement(KpiCard, {
        etiket: "Bekleyen sipariş",
        varyant: "ikincil",
        iyiYon: "asagi-iyi",
        bosDavranisi: "sifir",
        adet: 1250,
        karsilastirma: { anlik: "şu an" },
        vurgu: "uyari",
      })
    );
    expect(adet).toContain("1.250");
    expect(adet).toContain("şu an");
    expect(adet).toContain("text-critical");
    const hatali = kart({ hataReferansi: "a1b2c3d4" });
    expect(hatali).toContain("Yüklenemedi");
    expect(hatali).toContain("a1b2c3d4");
    expect(hatali).not.toContain("₺1.200,00");
  });

  it("ikincil metrik: değerin altında tek satır, nötr ve küçük; hata ve boş durumda yazılmaz", () => {
    const h = kart({ adet: 12, tutar: undefined, taban: undefined, karsilastirma: { anlik: "şu an" }, ikincilMetrik: "Medyan hazırlama süresi: 1,4 gün" });
    expect(h).toContain('<p class="mt-1 text-xs text-slate-500">Medyan hazırlama süresi: 1,4 gün</p>');
    expect(h.indexOf("şu an")).toBeLessThan(h.indexOf("Medyan hazırlama"));
    expect(kart({ ikincilMetrik: "x", hataReferansi: "R-1" })).not.toContain(">x<");
  });

  it("trend verilirse kart içinde sparkline çizilir", () => {
    const h = kart({ trend: { seri: ["1", "2", "3"], sonDevamEdiyor: true, ozet: "Son 3 ay" } });
    expect(h).toContain("<svg");
    expect(h).toContain("data-devam-ediyor");
  });
});

describe("KpiSatiri — statik grid, ilk kart birincil", () => {
  const satir = (n: number) =>
    renderToStaticMarkup(createElement(KpiSatiri, null, ...Array.from({ length: n }, (_, i) => createElement("span", { key: i }, i))));

  it("kart sayısına göre sınıflar; eşikler satırın kendi genişliği (container query)", () => {
    expect(satir(4)).toContain('class="@container mb-6"');
    expect(satir(4)).toContain("grid-cols-2 @min-[576px]:grid-cols-3 @min-[984px]:grid-cols-5");
    expect(satir(4)).toContain("col-span-2 @min-[576px]:col-span-3 @min-[984px]:col-span-2");
    expect(satir(3)).toContain("grid-cols-2 @min-[784px]:grid-cols-4");
    expect(satir(2)).toContain("grid-cols-1 @min-[576px]:grid-cols-3");
    expect(satir(1)).toContain('data-kpi-satiri="1"');
  });

  it("en çok 4 kart; boş satır yok", () => {
    expect(() => satir(5)).toThrow(/1–4 kart/);
    expect(() => satir(0)).toThrow(/1–4 kart/);
  });

  it("iskelet aynı grid'i, aynı değer satırını ve aynı metinleri kullanır", () => {
    const y = { etiket: "Tahsilat", varyant: "ikincil" as const, para: true, degisim: true, trend: false, altNot: "Bu ay · geçen aya göre" };
    const h = renderToStaticMarkup(
      createElement(KpiSatiriIskeleti, { kartlar: [{ ...y, etiket: "Ciro", varyant: "birincil", trend: true }, y, y, { ...y, degisim: { anlik: "şu an" } }] })
    );
    expect(h).toContain("grid-cols-2 @min-[576px]:grid-cols-3 @min-[984px]:grid-cols-5");
    expect(h).toContain("[font-size:clamp(1.25rem,13cqi,1.875rem)]");
    // Metin CSS içeriğinde: aynı kırılım, ama DOM metni değil (metin seçicilerine karışmaz).
    expect(h).toContain("before:content-[attr(data-metin)]");
    expect(h).toContain('data-metin="Bu ay · geçen aya göre"');
    expect(h).toContain('data-metin="şu an"');
    expect(h).not.toMatch(/>(Bu ay · geçen aya göre|şu an|Ciro|Tahsilat)</);
  });

  it("iskelet ikincil metrik satırını aynı metinle taşır", () => {
    const h = renderToStaticMarkup(
      createElement(KpiSatiriIskeleti, {
        kartlar: [{ etiket: "Bekleyen", varyant: "birincil", para: false, degisim: { anlik: "şu an" }, trend: false, ikincilMetrik: "Medyan hazırlama süresi: 0,0 gün" }],
      })
    );
    expect(h).toContain('<p class="mt-1 text-xs"><span data-metin="Medyan hazırlama süresi: 0,0 gün"');
  });
});
