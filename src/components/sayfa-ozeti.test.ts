import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { ANA_MENU, OZET_SIRASI, YALNIZ_YONETICI, gorunurOzetler } from "@/components/menu";
import { SayfaOzeti, type OzetSatiri } from "@/components/SayfaOzeti";

// Dashboard'un sayfa özetleri: menüdeki her sayfa için bir kart, rolün gördüğü kadar.

describe("gorunurOzetler — bütün sayfaların özeti, rolün gördüğü kadar", () => {
  it("menüdeki her sayfanın (dashboard hariç) tam bir özeti var; tekrar yok", () => {
    const menu = ANA_MENU.map((m) => m.href).filter((h) => h !== "/dashboard");
    expect([...OZET_SIRASI].sort()).toEqual([...menu].sort());
    expect(new Set(OZET_SIRASI).size).toBe(OZET_SIRASI.length);
  });

  it("yönetici hepsini görür; operasyon yalnız yöneticinin sayfalarını görmez; sıra korunur", () => {
    expect(gorunurOzetler("YONETICI")).toEqual([...OZET_SIRASI]);
    const operasyon = gorunurOzetler("OPERASYON");
    expect(operasyon.filter((s) => YALNIZ_YONETICI.has(s))).toEqual([]);
    expect(operasyon).toEqual(OZET_SIRASI.filter((s) => !YALNIZ_YONETICI.has(s)));
    expect(operasyon).toHaveLength(7);
  });
});

describe("SayfaOzeti — kart", () => {
  const kart = (p: { satirlar?: OzetSatiri[]; liste?: string; hataReferansi?: string }) =>
    renderToStaticMarkup(createElement(SayfaOzeti, { baslik: "Stok", href: "/stock", ...p }));

  it("başlık sayfaya bağlantı; satırlar etiket–değer; ton yalnız verilen satırda", () => {
    const h = kart({ satirlar: [{ etiket: "Tükendi", deger: "1", ton: "hata" }, { etiket: "Kritik", deger: "2", ton: "uyari" }, { etiket: "Aktif", deger: "0" }] });
    expect(h).toContain('role="group"');
    expect(h).toContain('aria-label="Stok"');
    expect(h).toContain('href="/stock"');
    expect(h).toMatch(/text-negative">1</);
    expect(h).toMatch(/text-critical">2</);
    expect(h).toMatch(/text-slate-900">0</);
  });

  it("satır bağlantısı süzülmüş listeye gider; kısa liste ayrı bölümde", () => {
    const h = kart({ satirlar: [{ etiket: "Sahipsiz", deger: "3", href: "/doctors?sahip=yok" }], liste: "liste içeriği" });
    expect(h).toContain('href="/doctors?sahip=yok"');
    expect(h).toMatch(/border-t[^>]*>liste içeriği</);
  });

  it("hata: yalnız bu kart 'Yüklenemedi' ve referans; satırlar gösterilmez (X-3)", () => {
    const h = kart({ satirlar: [{ etiket: "Tükendi", deger: "1" }], hataReferansi: "a1b2c3d4" });
    expect(h).toContain("Yüklenemedi");
    expect(h).toContain("a1b2c3d4");
    expect(h).not.toContain("Tükendi");
  });
});
