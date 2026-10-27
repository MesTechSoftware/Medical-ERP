import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { AktiviteAkisi } from "@/components/dashboard/AktiviteAkisi";

const simdi = new Date("2026-10-27T11:00:00Z");
const satir = (i: number, dk: number) => ({ id: `k${i}`, an: new Date(simdi.getTime() - dk * 60_000), metin: `Olay ${i}` });
const akis = (satirlar: ReturnType<typeof satir>[]) => renderToStaticMarkup(createElement(AktiviteAkisi, { satirlar, simdi }));

describe("AktiviteAkisi (brief §3.6)", () => {
  it("göreli zaman görünür, tam tarih title'da (İstanbul); makine okur dateTime", () => {
    const h = akis([satir(1, 12)]);
    expect(h).toMatch(/<time dateTime="2026-10-27T10:48:00.000Z" title="27\.10\.2026 13:48"[^>]*>12 dk önce<\/time>/);
    expect(h).toContain("Olay 1");
  });

  it("telefonda ilk 5 satır; fazlası yalnız geniş ekranda", () => {
    const h = akis(Array.from({ length: 7 }, (_, i) => satir(i, i)));
    expect([...h.matchAll(/<li class="[^"]*max-md:hidden/g)]).toHaveLength(2);
  });

  it("'Tümünü gör' denetim kaydına bağlantı; boş akışta sakin metin", () => {
    expect(akis([satir(1, 1)])).toMatch(/<a[^>]*href="\/audit-logs"[^>]*>[\s\S]*Tümünü gör/);
    expect(akis([])).toContain("Henüz hareket yok.");
  });
});
