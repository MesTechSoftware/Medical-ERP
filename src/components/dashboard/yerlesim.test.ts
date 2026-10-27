import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { DikkatListesi } from "@/components/dashboard/DikkatListesi";
import { KritikStokListesi } from "@/components/dashboard/KritikStokListesi";
import { ZamanFiltresi } from "@/components/dashboard/ZamanFiltresi";
import { SayfaSeridi } from "@/components/SayfaSeridi";
import type { Istisna } from "@/lib/istisnalar";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("ZamanFiltresi (K-D2, brief §3.7)", () => {
  it("dört aralık, her biri ?aralik= bağlantısı; yalnız seçili olan aria-current", () => {
    const h = html(createElement(ZamanFiltresi, { secili: "yil" }));
    expect(h).toMatch(/^<nav[^>]*aria-label="Zaman aralığı"/);
    expect([...h.matchAll(/href="\/dashboard\?aralik=(\w+)"/g)].map((m) => m[1])).toEqual(["bugun", "hafta", "ay", "yil"]);
    expect(h).toMatch(/<a(?=[^>]*aria-current="page")[^>]*>Bu Yıl<\/a>/);
    expect([...h.matchAll(/aria-current/g)]).toHaveLength(1);
  });
});

describe("KritikStokListesi — hızlı işlemli (brief §3.5)", () => {
  const urun = (id: string, stok: number) => ({ id, name: `Ürün ${id}`, code: id.toUpperCase(), stok });

  it("yalnız kritik ve tükenen, en düşük önce; satır başına önseçili 'Stok girişi' bağlantısı", () => {
    const h = html(createElement(KritikStokListesi, { stoklar: [urun("bol", 50), urun("az", 5), urun("yok", 0)] }));
    expect(h).not.toContain("Ürün bol");
    expect(h.indexOf("Ürün yok")).toBeLessThan(h.indexOf("Ürün az"));
    expect(h).toMatch(/<a[^>]*href="\/stock\?urun=yok"[^>]*>[\s\S]*?lucide-package-plus[\s\S]*?Stok girişi<\/a>/);
  });

  it("en çok 5 satır; fazlası stok sayfasında", () => {
    const h = html(createElement(KritikStokListesi, { stoklar: Array.from({ length: 7 }, (_, i) => urun(`u${i}`, i)) }));
    expect([...h.matchAll(/href="\/stock\?urun=/g)]).toHaveLength(5);
    expect(h).toMatch(/<a[^>]*href="\/stock"[^>]*>[\s\S]*?\+2 ürün daha/);
  });

  it("kritik ürün yoksa sakin metin", () => {
    expect(html(createElement(KritikStokListesi, { stoklar: [urun("bol", 50)] }))).toContain("Kritik stokta ürün yok.");
  });
});

describe("DikkatListesi (brief §3.5)", () => {
  const istisna = (kod: Istisna["kod"], ton: Istisna["ton"], adet: number): Istisna => ({
    kod,
    ton,
    adet,
    metin: kod,
    href: `/${kod}`,
    eylem: `${kod} eylemi`,
  });

  it("bölüm #dikkat; her madde ton etiketinde adet, metin ve eylem bağlantısı; uyarıda açık uyarı tonu", () => {
    const h = html(createElement(DikkatListesi, { istisnalar: [istisna("tukenen", "hata", 1), istisna("kritik", "uyari", 2)] }));
    expect(h).toContain('id="dikkat"');
    expect(h).toMatch(/bg-negative-bg text-negative">1<\/span>/);
    expect(h).toMatch(/bg-critical-bg text-critical">2<\/span>/);
    expect(h).toMatch(/<a[^>]*href="\/kritik"[^>]*>kritik eylemi<\/a>/);
    expect(h).toContain("border-critical/30");
  });

  it("istisna yoksa sakin metin; yeşil rozet ve ünlem yok", () => {
    const h = html(createElement(DikkatListesi, { istisnalar: [] }));
    expect(h).toContain("Dikkat gerektiren bir şey yok.");
    expect(h).not.toMatch(/positive|!/);
  });
});

describe("SayfaSeridi — kompakt sayfa şeridi", () => {
  it("sayfa başına ikon, ad ve tek sayı; bağlantı kendi sayfasına; iş akışı sayısı sıfırdan büyükse uyarı tonu", () => {
    const h = html(
      createElement(SayfaSeridi, {
        kutular: [
          { sayfa: "/orders", sonuc: { tamam: true, deger: 3 } },
          { sayfa: "/products", sonuc: { tamam: true, deger: 12 } },
          { sayfa: "/shipping", sonuc: { tamam: true, deger: 0 } },
        ],
        donemNotu: "Bu ay",
      })
    );
    expect(h).toMatch(/<a[^>]*href="\/orders"[^>]*>[\s\S]*?<svg[\s\S]*?Siparişler[\s\S]*?text-critical[^>]*>3 bekliyor</);
    expect(h).toMatch(/href="\/products"[\s\S]*?text-slate-500[^>]*>12 aktif</);
    expect(h).toMatch(/href="\/shipping"[\s\S]*?text-slate-500[^>]*>0 kargolanacak</);
  });

  it("dönem notu yalnız görünen dönem sayılarını söyler (OPERASYON içe aktarımı görmez)", () => {
    const serit = (sayfalar: ("/collections" | "/imports" | "/orders")[]) =>
      html(createElement(SayfaSeridi, { kutular: sayfalar.map((sayfa) => ({ sayfa, sonuc: { tamam: true as const, deger: 1 } })), donemNotu: "Bu ay" }));
    expect(serit(["/collections", "/imports"])).toContain("Tahsilat ve içe aktarım sayıları: bu ay");
    expect(serit(["/orders", "/collections"])).toContain("Tahsilat sayısı: bu ay");
    expect(serit(["/orders", "/collections"])).not.toContain("içe aktarım");
    expect(serit(["/orders"])).not.toMatch(/sayı(sı|ları):/);
  });

  it("sorgu düşerse yalnız o kutu 'Yüklenemedi', referans title'da (X-3)", () => {
    const h = html(createElement(SayfaSeridi, { kutular: [{ sayfa: "/orders", sonuc: { tamam: false, referans: "a1b2c3d4" } }], donemNotu: "Bu ay" }));
    expect(h).toMatch(/title="Hata referansı: a1b2c3d4"[^>]*>Yüklenemedi</);
  });
});
