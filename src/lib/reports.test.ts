import { describe, expect, it } from "vitest";
import {
  ciroField,
  collectionRate,
  ratePercent,
  weightedDiscount,
} from "@/lib/reports";

describe("ratePercent", () => {
  it("yüzdeyi 2 ondalıkla hesaplar", () => {
    expect(ratePercent(1n, 2n)).toBe(50);
    expect(ratePercent(1n, 3n)).toBe(33.33);
    expect(ratePercent(425n, 1000n)).toBe(42.5);
  });

  it("bölen sıfırsa 0 döner (sıfıra bölme yok)", () => {
    expect(ratePercent(100n, 0n)).toBe(0);
    expect(ratePercent(0n, 0n)).toBe(0);
  });

  it("payı bölenden büyükse >100 döner", () => {
    expect(ratePercent(150n, 100n)).toBe(150);
  });
});

describe("collectionRate — FR-62", () => {
  it("tahsil edilen / faturalanan yüzdesi", () => {
    expect(collectionRate(700_00n, 1000_00n)).toBe(70);
  });

  it("hiç fatura yoksa 0", () => {
    expect(collectionRate(0n, 0n)).toBe(0);
  });

  it("tam tahsilat %100", () => {
    expect(collectionRate(500_00n, 500_00n)).toBe(100);
  });
});

describe("weightedDiscount", () => {
  it("tutar ağırlıklı ortalama iskonto hesaplar", () => {
    // Liste 1000, satış 850 → %15 iskonto, tek kalem.
    expect(
      weightedDiscount([
        { listPriceAtSale: 1000_00n, netUnitPrice: 850_00n, quantity: 1 },
      ])
    ).toBe(15);
  });

  it("büyük siparişler ortalamayı daha çok çeker (ağırlıklı)", () => {
    // Küçük kalem %50 iskonto (1 adet), büyük kalem %0 iskonto (99 adet).
    // Basit ortalama %25 olurdu; ağırlıklı ≈ %0.5.
    const w = weightedDiscount([
      { listPriceAtSale: 100_00n, netUnitPrice: 50_00n, quantity: 1 },
      { listPriceAtSale: 100_00n, netUnitPrice: 100_00n, quantity: 99 },
    ]);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
  });

  it("iskonto yoksa %0", () => {
    expect(
      weightedDiscount([
        { listPriceAtSale: 500_00n, netUnitPrice: 500_00n, quantity: 3 },
      ])
    ).toBe(0);
  });

  it("boş listede %0 (sıfıra bölme yok)", () => {
    expect(weightedDiscount([])).toBe(0);
  });
});

describe("ciroField — FR-64 KDV toggle", () => {
  it("NET modda net, GROSS modda brüt alanını seçer", () => {
    expect(ciroField("NET")).toBe("netTotal");
    expect(ciroField("GROSS")).toBe("grossTotal");
  });
});
