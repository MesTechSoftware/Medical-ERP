import { describe, expect, it } from "vitest";
import {
  DEFAULT_VAT_RATE,
  discountRate,
  grossFromNet,
  lineTotals,
  netFromGross,
  sumLineTotals,
  vatAmount,
} from "@/lib/vat";

describe("vatAmount", () => {
  it("%20 KDV'yi hesaplar", () => {
    expect(vatAmount(100_00n, 20)).toBe(20_00n);
    expect(vatAmount(59_500_000n, 20)).toBe(11_900_000n); // PRD örnek senaryosu
  });

  it("kuruş altını yarımı yukarı yuvarlar", () => {
    // 3 kuruş * %20 = 0,6 kuruş -> 1
    expect(vatAmount(3n, 20)).toBe(1n);
    // 2 kuruş * %20 = 0,4 kuruş -> 0
    expect(vatAmount(2n, 20)).toBe(0n);
    // tam yarım: 25 * 20 / 100 = 5 (tam) ; 5 kuruş %10 = 0,5 -> 1
    expect(vatAmount(5n, 10)).toBe(1n);
  });

  it("%0 oranını destekler", () => {
    expect(vatAmount(12345n, 0)).toBe(0n);
  });

  it("geçersiz oranı reddeder", () => {
    expect(() => vatAmount(100n, -1)).toThrow();
    expect(() => vatAmount(100n, 101)).toThrow();
    expect(() => vatAmount(100n, 20.5)).toThrow();
  });
});

describe("netFromGross / grossFromNet", () => {
  it("net -> brüt -> net turu değeri korur (temiz değerlerde)", () => {
    const net = 850_00n;
    const gross = grossFromNet(net, 20);
    expect(gross).toBe(1020_00n);
    expect(netFromGross(gross, 20)).toBe(net);
  });

  it("KDV dahil girilen fiyatı net'e çevirir", () => {
    // 120,00 ₺ KDV dahil -> 100,00 ₺ net
    expect(netFromGross(120_00n, 20)).toBe(100_00n);
  });
});

describe("lineTotals", () => {
  it("kalem tutarlarını hesaplar", () => {
    const l = lineTotals(850_00n, 700, 20);
    expect(l.lineNetTotal).toBe(595_000_00n);
    expect(l.vatAmount).toBe(119_000_00n);
    expect(l.lineGrossTotal).toBe(714_000_00n);
  });

  it("geçersiz miktarı reddeder", () => {
    expect(() => lineTotals(100n, 0, 20)).toThrow();
    expect(() => lineTotals(100n, -1, 20)).toThrow();
    expect(() => lineTotals(100n, 1.5, 20)).toThrow();
  });
});

describe("sumLineTotals — 🔴 kalemler toplamı = sipariş toplamı", () => {
  it("boş siparişte sıfır döner", () => {
    expect(sumLineTotals([])).toEqual({
      netTotal: 0n,
      vatTotal: 0n,
      grossTotal: 0n,
    });
  });

  it("kalem bazında yuvarlanan KDV'lerin toplamı, sipariş toplamına eşittir", () => {
    // Her biri tek başına yuvarlama artığı üreten kalemler.
    const lines = [
      lineTotals(3n, 1, 20), // net 3 -> KDV 1
      lineTotals(3n, 1, 20),
      lineTotals(3n, 1, 20),
    ];
    const totals = sumLineTotals(lines);

    expect(totals.netTotal).toBe(9n);
    expect(totals.vatTotal).toBe(3n); // 1+1+1 — toplamdan hesaplansa 2 olurdu (9*0.2=1.8)
    expect(totals.grossTotal).toBe(12n);

    // Değişmez: brüt toplam = net toplam + KDV toplam
    expect(totals.grossTotal).toBe(totals.netTotal + totals.vatTotal);
    // Değişmez: kalem brütlerinin toplamı = sipariş brütü
    expect(lines.reduce((s, l) => s + l.lineGrossTotal, 0n)).toBe(
      totals.grossTotal
    );
  });

  it("toplam üzerinden hesaplamakla kalem bazından farkı gösterir", () => {
    const lines = Array.from({ length: 7 }, () => lineTotals(1n, 1, 20));
    const totals = sumLineTotals(lines);
    // Kalem bazında: 7 x round(0,2) = 7 x 0 = 0
    expect(totals.vatTotal).toBe(0n);
    // Toplam bazında olsaydı: round(7 * 0,2) = round(1,4) = 1  -> KURAL BU DEĞİL
    expect(vatAmount(totals.netTotal, 20)).toBe(1n);
  });
});

describe("discountRate", () => {
  it("iskonto yüzdesini hesaplar", () => {
    expect(discountRate(1000_00n, 850_00n)).toBe(15);
    expect(discountRate(1000_00n, 1000_00n)).toBe(0);
  });

  it("liste fiyatı 0 ise 0 döner (sıfıra bölme yok)", () => {
    expect(discountRate(0n, 0n)).toBe(0);
  });

  it("liste üstü fiyatta negatif iskonto döner", () => {
    expect(discountRate(1000_00n, 1100_00n)).toBe(-10);
  });
});

describe("DEFAULT_VAT_RATE", () => {
  it("%20'dir (D-03)", () => {
    expect(DEFAULT_VAT_RATE).toBe(20);
  });
});
