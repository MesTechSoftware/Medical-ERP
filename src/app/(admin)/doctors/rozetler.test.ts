import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Decimal from "decimal.js";

import { describe, expect, it } from "vitest";

import { DurumRozetleri } from "./DurumRozetleri";
import { BakiyeHucresi } from "./bakiye";

// Cari listesi ve yan panelin durum rozetleri — KABUL_KRITERLERI A-12-5, A-13-3; spec Ü-18 §3.3.

const LIMITSIZ = { risk: new Decimal("0"), krediLimiti: null, limitAsildi: false };
const ciz = (p: Parameters<typeof DurumRozetleri>[0]) => renderToStaticMarkup(createElement(DurumRozetleri, p));
const rozetler = (h: string) => [...h.matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((m) => m[1]);

describe("DurumRozetleri", () => {
  it("aktif yeşil, pasif gri", () => {
    expect(ciz({ status: "AKTIF", eksikFatura: false, risk: LIMITSIZ })).toContain("bg-positive-bg");
    const pasif = ciz({ status: "PASIF", eksikFatura: false, risk: LIMITSIZ });
    expect(rozetler(pasif)).toEqual(["Pasif"]);
    expect(pasif).toContain("bg-neutral-bg");
  });

  it("eksik fatura turuncu (A-13-3)", () => {
    const h = ciz({ status: "AKTIF", eksikFatura: true, risk: LIMITSIZ });
    expect(rozetler(h)).toEqual(["Aktif", "Eksik fatura"]);
    expect(h).toMatch(/bg-critical-bg[^>]*>Eksik fatura/);
  });

  it("limit aşımı kırmızı, ipucunda risk ve limit (A-12-5)", () => {
    const h = ciz({ status: "AKTIF", eksikFatura: false, risk: { risk: new Decimal("152400"), krediLimiti: new Decimal("150000"), limitAsildi: true } });
    expect(h).toMatch(/bg-negative-bg[^>]*>Limit aşıldı/);
    expect(h).toContain('title="Risk ₺152.400,00 / Limit ₺150.000,00"');
  });

  it("limite eşit risk rozet taşımaz", () => {
    const h = ciz({ status: "AKTIF", eksikFatura: false, risk: { risk: new Decimal("100"), krediLimiti: new Decimal("100"), limitAsildi: false } });
    expect(rozetler(h)).toEqual(["Aktif"]);
  });

  it("üçü birden sırayla", () => {
    const h = ciz({ status: "PASIF", eksikFatura: true, risk: { risk: new Decimal("2"), krediLimiti: new Decimal("1"), limitAsildi: true } });
    expect(rozetler(h)).toEqual(["Pasif", "Eksik fatura", "Limit aşıldı"]);
  });
});

describe("BakiyeHucresi — K-2: çıplak negatif yok", () => {
  const ciz2 = (b: string, yon: "BORC" | "ALACAK" | "KAPALI" = Number.parseFloat(b) > 0 ? "BORC" : Number.parseFloat(b) < 0 ? "ALACAK" : "KAPALI") =>
    renderToStaticMarkup(createElement(BakiyeHucresi, { bakiye: new Decimal(b), yon }));

  it("borç: tutar ve Doktor borçlu", () => {
    const h = ciz2("1250.5");
    expect(h).toContain("₺1.250,50");
    expect(h).toContain("Doktor borçlu");
  });

  it("avans: mutlak tutar ve alacaklı", () => {
    const h = ciz2("-300");
    expect(h).toContain("₺300,00");
    expect(h).not.toMatch(/-₺|-300/);
    expect(h).toContain("Doktor alacaklı (avans)");
  });

  it("sıfır: kapalı", () => {
    expect(ciz2("0")).toContain("Bakiye kapalı");
  });

  it("taban etiketi hücrede yazılmaz (başlıktadır — Ü-3-1)", () => {
    expect(ciz2("10")).not.toContain("data-taban");
  });
});
