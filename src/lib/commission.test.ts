import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMMISSION_RATE,
  calculateCommission,
  commissionAmount,
  formatPeriod,
  isPeriodBefore,
  netPortionOfAllocation,
  nextPeriod,
  periodEquals,
  periodOf,
} from "@/lib/commission";

describe("DEFAULT_COMMISSION_RATE", () => {
  it("%5'tir (FR-30)", () => {
    expect(DEFAULT_COMMISSION_RATE).toBe(5);
  });
});

describe("periodOf / nextPeriod — FR-32 takvim ayı", () => {
  it("tarihin ayını 1-12 olarak verir", () => {
    expect(periodOf(new Date(2026, 0, 15))).toEqual({ year: 2026, month: 1 });
    expect(periodOf(new Date(2026, 11, 31))).toEqual({ year: 2026, month: 12 });
  });

  it("🔴 aralıktan sonra yılı doğru artırır", () => {
    expect(nextPeriod({ year: 2026, month: 12 })).toEqual({
      year: 2027,
      month: 1,
    });
  });

  it("ay içinde normal ilerler", () => {
    expect(nextPeriod({ year: 2026, month: 7 })).toEqual({
      year: 2026,
      month: 8,
    });
  });

  it("dönem karşılaştırması yıl sınırını doğru geçer", () => {
    expect(
      isPeriodBefore({ year: 2026, month: 12 }, { year: 2027, month: 1 })
    ).toBe(true);
    expect(
      isPeriodBefore({ year: 2027, month: 1 }, { year: 2026, month: 12 })
    ).toBe(false);
    expect(
      periodEquals({ year: 2026, month: 3 }, { year: 2026, month: 3 })
    ).toBe(true);
  });

  it("okunur biçimlendirir", () => {
    expect(formatPeriod({ year: 2026, month: 7 })).toBe("07/2026");
  });
});

describe("netPortionOfAllocation — D-17/D-19 orantılı net", () => {
  // 595.000 net + 119.000 KDV = 714.000 brüt (PRD örnek senaryosu)
  const NET = 595_000_00n;
  const GROSS = 714_000_00n;

  it("tam tahsilatta siparişin tamamının netini verir", () => {
    expect(netPortionOfAllocation(GROSS, NET, GROSS)).toBe(NET);
  });

  it("🔴 kısmi tahsilatta ORANTILI net verir", () => {
    // Brütün yarısı tahsil edildiyse net matrah da yarıdır.
    const half = GROSS / 2n;
    expect(netPortionOfAllocation(half, NET, GROSS)).toBe(NET / 2n);
  });

  it("KDV'yi matraha KARIŞTIRMAZ", () => {
    // 120 ₺ brüt tahsilat, %20 KDV'li siparişte 100 ₺ net matrah üretmeli.
    expect(netPortionOfAllocation(120_00n, 100_00n, 120_00n)).toBe(100_00n);
  });

  it("brüt sıfırsa (bozuk veri) 0 döner, patlamaz", () => {
    expect(netPortionOfAllocation(100n, 0n, 0n)).toBe(0n);
  });

  it("parça parça tahsilatların net toplamı, tam tahsilatın netine yakın kalır", () => {
    // Yuvarlama nedeniyle en fazla 1 kuruş sapabilir.
    const parts = [100_00n, 200_00n, 414_000_00n - 300_00n];
    const sum = parts.reduce(
      (s, p) => s + netPortionOfAllocation(p, NET, GROSS),
      0n
    );
    const whole = netPortionOfAllocation(
      parts.reduce((s, p) => s + p, 0n),
      NET,
      GROSS
    );
    const diff = sum > whole ? sum - whole : whole - sum;
    expect(diff).toBeLessThanOrEqual(2n);
  });
});

describe("commissionAmount", () => {
  it("%5 primi hesaplar (PRD örneği: 595.000 -> 29.750)", () => {
    expect(commissionAmount(595_000_00n, 5)).toBe(29_750_00n);
  });

  it("ondalıklı oranı destekler", () => {
    expect(commissionAmount(1000_00n, 5.5)).toBe(55_00n);
  });

  it("negatif matrahta negatif prim üretir (FR-35 düzeltmesi)", () => {
    expect(commissionAmount(-1000_00n, 5)).toBe(-50_00n);
  });

  it("kuruş altını yarımı yukarı yuvarlar", () => {
    // 10 kuruş * %5 = 0,5 kuruş -> 1
    expect(commissionAmount(10n, 5)).toBe(1n);
  });

  it("geçersiz oranı reddeder", () => {
    expect(() => commissionAmount(100n, -1)).toThrow();
    expect(() => commissionAmount(100n, 101)).toThrow();
    expect(() => commissionAmount(100n, NaN)).toThrow();
  });
});

describe("calculateCommission", () => {
  it("dönem içi tahsilatları toplayıp primi hesaplar", () => {
    const r = calculateCommission({
      netAllocations: [100_00n, 200_00n, 300_00n],
      ratePercent: 5,
    });
    expect(r.baseAmount).toBe(600_00n);
    expect(r.commissionAmount).toBe(30_00n);
    expect(r.adjustmentTotal).toBe(0n);
  });

  it("🔴 FR-35: önceki dönemden gelen NEGATİF düzeltmeyi matrahtan düşer", () => {
    const r = calculateCommission({
      netAllocations: [1000_00n],
      adjustments: [-200_00n], // kapanmış dönemdeki iptalin karşılığı
      ratePercent: 5,
    });
    expect(r.adjustmentTotal).toBe(-200_00n);
    expect(r.baseAmount).toBe(800_00n);
    expect(r.commissionAmount).toBe(40_00n);
  });

  it("düzeltme matrahı negatife düşürebilir (prim de negatif olur)", () => {
    const r = calculateCommission({
      netAllocations: [100_00n],
      adjustments: [-500_00n],
      ratePercent: 5,
    });
    expect(r.baseAmount).toBe(-400_00n);
    expect(r.commissionAmount).toBe(-20_00n);
  });

  it("tahsilat yoksa sıfır prim", () => {
    const r = calculateCommission({ netAllocations: [], ratePercent: 5 });
    expect(r.baseAmount).toBe(0n);
    expect(r.commissionAmount).toBe(0n);
  });

  it("satıcı bazlı oran override'ı uygulanır (FR-31)", () => {
    const r = calculateCommission({
      netAllocations: [1000_00n],
      ratePercent: 8,
    });
    expect(r.commissionAmount).toBe(80_00n);
  });
});
