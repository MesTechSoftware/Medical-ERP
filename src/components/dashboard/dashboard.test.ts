import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { IstisnaBandi } from "@/components/dashboard/IstisnaBandi";
import type { Istisna } from "@/lib/istisnalar";

const istisna = (kod: Istisna["kod"], ton: Istisna["ton"], adet: number): Istisna => ({
  kod,
  ton,
  adet,
  metin: kod,
  href: `/${kod}`,
  eylem: `${kod} eylemi`,
});
const bant = (liste: Istisna[]) => renderToStaticMarkup(createElement(IstisnaBandi, { istisnalar: liste }));

describe("IstisnaBandi (brief §3.1)", () => {
  it("istisna yoksa hiç çizilmez", () => {
    expect(bant([])).toBe("");
  });

  it("sabit bölge: adı 'Dikkat gerektirenler'; canlı bölge ve kapatma yok", () => {
    const h = bant([istisna("kritik", "uyari", 2)]);
    expect(h).toMatch(/^<section[^>]*role="region"[^>]*aria-label="Dikkat gerektirenler"/);
    expect(h).not.toContain("aria-live");
    expect(h).not.toContain("<button");
  });

  it("her madde: semantik ikon, metin ve eylem bağlantısı", () => {
    const h = bant([istisna("tukenen", "hata", 1), istisna("kritik", "uyari", 2)]);
    expect(h).toContain("lucide-octagon-alert");
    expect(h).toContain("lucide-triangle-alert");
    expect(h).toContain("1 tukenen");
    expect(h).toMatch(/<a[^>]*href="\/tukenen"[^>]*>tukenen eylemi<\/a>/);
  });

  it("en çok 3 madde, verilen sırayla; fazlası '+N uyarı daha' ile #dikkat'e", () => {
    const h = bant([
      istisna("tukenen", "hata", 1),
      istisna("kritik", "uyari", 2),
      istisna("eskiOnay", "uyari", 3),
      istisna("faturaEksik", "uyari", 4),
      istisna("sahipsiz", "uyari", 5),
    ]);
    expect([...h.matchAll(/<li\b/g)]).toHaveLength(4);
    expect(h.indexOf("1 tukenen")).toBeLessThan(h.indexOf("3 eskiOnay"));
    expect(h).not.toContain("4 faturaEksik");
    expect(h).toMatch(/<a[^>]*href="#dikkat"[^>]*>\+2 uyarı daha<\/a>/);
  });

  it("üç ya da daha az maddede '+N' bağlantısı yok", () => {
    expect(bant([istisna("kritik", "uyari", 2)])).not.toContain("#dikkat");
  });
});
