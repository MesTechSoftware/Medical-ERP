import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { BarMicro, OranCubugu } from "@/components/grafik/BarMicro";
import { ColumnMicro } from "@/components/grafik/ColumnMicro";
import { Sparkline } from "@/components/grafik/Sparkline";
import { GrafikIskeleti } from "@/components/Iskelet";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const yollar = (h: string) => [...h.matchAll(/<path[^>]* d="([^"]+)"/g)].map((m) => m[1]);

describe("Sparkline", () => {
  it("ikiden az noktada çizmez, aynı ölçüde 'Veri yok' gösterir", () => {
    const h = html(createElement(Sparkline, { seri: ["5", null], ozet: "özet" }));
    expect(h).toContain("Veri yok");
    expect(h).not.toContain("<svg");
  });

  it("boşlukta çizgi kesilir; araya nokta uydurulmaz", () => {
    const h = html(createElement(Sparkline, { seri: ["1", "2", null, "3", "4"], ozet: "özet" }));
    const cizgiler = yollar(h).filter((d) => d.includes("L"));
    expect(cizgiler).toHaveLength(2);
  });

  it("son nokta vurgulu; devam eden ayda içi boş işaret ek olarak çizilir", () => {
    const tamam = html(createElement(Sparkline, { seri: ["1", "2"], ozet: "özet" }));
    const devam = html(createElement(Sparkline, { seri: ["1", "2"], ozet: "özet", sonDevamEdiyor: true }));
    expect(tamam).toContain("stroke-brand");
    expect(tamam).not.toContain("data-devam-ediyor");
    expect(devam).toContain("data-devam-ediyor");
  });

  it("grafik ekran okuyucudan gizli, özet görünmez metin olarak yanında", () => {
    const h = html(createElement(Sparkline, { seri: ["1", "2"], ozet: "Son 6 ay" }));
    expect(h).toContain('aria-hidden="true"');
    expect(h).toMatch(/<span class="sr-only">Son 6 ay<\/span>/);
  });
});

describe("ColumnMicro", () => {
  it("her değer için bir sütun; boşlukta sütun yok", () => {
    const h = html(createElement(ColumnMicro, { seri: ["1", null, "3"], ozet: "özet" }));
    expect((h.match(/<rect/g) ?? []).length).toBe(2);
  });

  it("devam eden ay açık tonlu ve kesik kenarlı", () => {
    const h = html(createElement(ColumnMicro, { seri: ["1", "3"], ozet: "özet", sonDevamEdiyor: true }));
    expect(h).toContain("data-devam-ediyor");
    expect(h).toContain('stroke-dasharray="2 2"');
    expect(h).toContain("fill-slate-200");
  });

  it("hepsi boşsa 'Veri yok'", () => {
    expect(html(createElement(ColumnMicro, { seri: [null, null], ozet: "özet" }))).toContain("Veri yok");
  });
});

describe("Sparkline / ColumnMicro — kök", () => {
  // Konumlu ata yoksa mutlak konumlu sr-only özet .tablo-kutusu'nun kırpmasından kaçar ve sayfayı
  // genişletir (iPad'de satıcı tablosu ölçüldü: 810 → 1024 px).
  it("kök öğe konumlu; görünmez özet kendi grafiğinin içinde kalır", () => {
    for (const h of [
      html(createElement(Sparkline, { seri: ["1", "2"], ozet: "özet" })),
      html(createElement(ColumnMicro, { seri: ["1", "2"], ozet: "özet" })),
    ]) {
      expect(h).toMatch(/^<span class="relative /);
      expect(h).toContain('<span class="sr-only">özet</span></span>');
    }
  });
});

describe("BarMicro / OranCubugu", () => {
  it("değer kesilmez, etiket kısalabilir", () => {
    const h = html(createElement(BarMicro, { satirlar: [{ anahtar: "a", etiket: "Uzun ürün adı", deger: "1.250", oran: 1 }] }));
    expect(h).toMatch(/class="truncate[^"]*"[^>]*>Uzun ürün adı/);
    expect(h).toMatch(/class="whitespace-nowrap[^"]*">1\.250/);
  });

  it("oran çubuğu genişliği orandır; sıfır ve boşlukta dolu çubuk yok", () => {
    expect(html(createElement(OranCubugu, { oran: 0.25 }))).toContain('width="25"');
    expect((html(createElement(OranCubugu, { oran: 0 })).match(/<rect/g) ?? []).length).toBe(1);
    expect((html(createElement(OranCubugu, { oran: null })).match(/<rect/g) ?? []).length).toBe(1);
  });

  it("boş listede 'Veri yok'", () => {
    expect(html(createElement(BarMicro, { satirlar: [] }))).toContain("Veri yok");
  });
});

describe("GrafikIskeleti", () => {
  it("grafikle aynı ölçü sınıflarını taşır", () => {
    expect(html(createElement(GrafikIskeleti, { boyut: "XS" }))).toContain("h-5 w-16 dokunmatik:h-7");
  });
});
