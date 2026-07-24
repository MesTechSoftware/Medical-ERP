import { describe, expect, it } from "vitest";
import {
  EARN_RATE_PERCENT,
  EXPIRY_MONTHS,
  availableBalance,
  earnFromCollection,
  expiredLots,
  expiringSoon,
  expiryFor,
  isExpired,
  planFifoSpend,
  type LedgerLot,
} from "@/lib/congress-ledger";

const lot = (
  id: string,
  earnedAt: string,
  remaining: bigint,
  expires?: string | null
): LedgerLot => ({
  id,
  earnedAt: new Date(earnedAt),
  expiresAt:
    expires === null
      ? null
      : new Date(expires ?? expiryFor(new Date(earnedAt)).toISOString()),
  remainingAmount: remaining,
});

describe("sabitler", () => {
  it("kazanım katsayısı %100 (D-11), süre 12 ay (D-10/D-22)", () => {
    expect(EARN_RATE_PERCENT).toBe(100);
    expect(EXPIRY_MONTHS).toBe(12);
  });
});

describe("expiryFor — D-22 rolling 12 ay", () => {
  it("kazanımdan 12 ay sonrasını verir", () => {
    expect(expiryFor(new Date(2026, 6, 23))).toEqual(new Date(2027, 6, 23));
  });

  it("takvim yılı sonuna DEĞİL, kazanım gününe göre hesaplar", () => {
    // Aralık kazanımı, ertesi yılın Aralık'ında dolar (yıl sonunda değil).
    expect(expiryFor(new Date(2026, 11, 20))).toEqual(new Date(2027, 11, 20));
  });

  it("ay sonlarını korur", () => {
    expect(expiryFor(new Date(2026, 0, 31))).toEqual(new Date(2027, 0, 31));
  });

  it("🔴 29 Şubat'ı 28 Şubat'a kırpar (1 Mart'a TAŞMAZ)", () => {
    // 2028 artık yıl; 2029 değil. Taşsaydı doktora fazladan gün verilirdi.
    const e = expiryFor(new Date(2028, 1, 29));
    expect(e.getFullYear()).toBe(2029);
    expect(e.getMonth()).toBe(1); // Şubat
    expect(e.getDate()).toBe(28);
  });

  it("saat bileşenini korur", () => {
    const e = expiryFor(new Date(2026, 5, 10, 14, 30));
    expect(e.getHours()).toBe(14);
    expect(e.getMinutes()).toBe(30);
  });
});

describe("availableBalance — RULE-08", () => {
  const asOf = new Date(2026, 6, 1);

  it("süresi dolmamış lotları toplar", () => {
    const lots = [
      lot("a", "2026-01-01", 100_00n),
      lot("b", "2026-02-01", 200_00n),
    ];
    expect(availableBalance(lots, asOf)).toBe(300_00n);
  });

  it("🔴 süresi DOLMUŞ lotu saymaz", () => {
    const lots = [
      lot("eski", "2025-01-01", 500_00n), // 2026-01-01'de doldu
      lot("yeni", "2026-06-01", 100_00n),
    ];
    expect(availableBalance(lots, asOf)).toBe(100_00n);
  });

  it("tükenmiş lotu saymaz", () => {
    expect(availableBalance([lot("a", "2026-01-01", 0n)], asOf)).toBe(0n);
  });

  it("süresiz (ADJUST) lotu sayar", () => {
    expect(
      availableBalance([lot("adj", "2020-01-01", 50_00n, null)], asOf)
    ).toBe(50_00n);
  });

  it("boş defterde sıfır", () => {
    expect(availableBalance([], asOf)).toBe(0n);
  });
});

describe("isExpired — sınır davranışı", () => {
  it("son kullanma ANINDA dolmuş sayılır", () => {
    const l = lot("a", "2026-01-01", 100n, "2026-06-01T00:00:00.000Z");
    expect(isExpired(l, new Date("2026-06-01T00:00:00.000Z"))).toBe(true);
    expect(isExpired(l, new Date("2026-05-31T23:59:59.000Z"))).toBe(false);
  });
});

describe("planFifoSpend — RULE-11 FIFO", () => {
  const asOf = new Date(2026, 6, 1);

  it("🔴 EN ESKİ kazanımdan düşer (giriş sırası değil)", () => {
    const lots = [
      lot("yeni", "2026-06-01", 500_00n),
      lot("eski", "2026-01-15", 300_00n),
    ];
    const plan = planFifoSpend(100_00n, lots, asOf);
    expect(plan.consumptions).toEqual([{ lotId: "eski", amount: 100_00n }]);
    expect(plan.shortfall).toBe(0n);
  });

  it("birden fazla lota taşar", () => {
    const lots = [
      lot("eski", "2026-01-15", 300_00n),
      lot("yeni", "2026-06-01", 500_00n),
    ];
    const plan = planFifoSpend(400_00n, lots, asOf);
    expect(plan.consumptions).toEqual([
      { lotId: "eski", amount: 300_00n },
      { lotId: "yeni", amount: 100_00n },
    ]);
  });

  it("🔴 bakiye yetmezse KISMİ harcama yapmaz, eksik tutarı bildirir (RULE-07/D-12)", () => {
    const lots = [lot("a", "2026-01-15", 100_00n)];
    const plan = planFifoSpend(250_00n, lots, asOf);
    expect(plan.consumptions).toEqual([]); // hiçbir şey tüketilmedi
    expect(plan.shortfall).toBe(150_00n);
  });

  it("süresi dolmuş lotu FIFO'ya sokmaz", () => {
    const lots = [
      lot("dolmus", "2025-01-01", 900_00n),
      lot("gecerli", "2026-06-01", 100_00n),
    ];
    const plan = planFifoSpend(100_00n, lots, asOf);
    expect(plan.consumptions).toEqual([{ lotId: "gecerli", amount: 100_00n }]);
  });

  it("süresi dolmuş bakiye yetersizliğe sebep olur", () => {
    const lots = [
      lot("dolmus", "2025-01-01", 900_00n),
      lot("gecerli", "2026-06-01", 100_00n),
    ];
    const plan = planFifoSpend(500_00n, lots, asOf);
    expect(plan.consumptions).toEqual([]);
    expect(plan.shortfall).toBe(400_00n);
  });

  it("tam bakiyeyi harcayabilir", () => {
    const lots = [lot("a", "2026-01-15", 100_00n)];
    const plan = planFifoSpend(100_00n, lots, asOf);
    expect(plan.shortfall).toBe(0n);
    expect(plan.consumptions).toEqual([{ lotId: "a", amount: 100_00n }]);
  });

  it("eşit kazanım tarihinde deterministik (id'ye göre)", () => {
    const lots = [
      lot("b", "2026-01-15", 50_00n),
      lot("a", "2026-01-15", 50_00n),
    ];
    expect(planFifoSpend(50_00n, lots, asOf).consumptions[0].lotId).toBe("a");
  });

  it("sıfır/negatif harcamayı reddeder", () => {
    expect(() => planFifoSpend(0n, [], asOf)).toThrow();
    expect(() => planFifoSpend(-1n, [], asOf)).toThrow();
  });

  it("girdi dizisini MUTASYONA UĞRATMAZ", () => {
    const lots = [
      lot("yeni", "2026-06-01", 500_00n),
      lot("eski", "2026-01-15", 300_00n),
    ];
    const before = lots.map((l) => l.id);
    planFifoSpend(100_00n, lots, asOf);
    expect(lots.map((l) => l.id)).toEqual(before);
  });
});

describe("expiredLots — FR-52 gecelik job", () => {
  it("süresi dolmuş ve bakiyesi kalan lotları verir", () => {
    const asOf = new Date(2026, 6, 1);
    const lots = [
      lot("dolmus", "2025-01-01", 100_00n),
      lot("dolmus-bos", "2025-01-01", 0n), // kalanı yok, EXPIRE gereksiz
      lot("gecerli", "2026-06-01", 50_00n),
    ];
    expect(expiredLots(lots, asOf).map((l) => l.id)).toEqual(["dolmus"]);
  });
});

describe("expiringSoon — FR-59 satış aracı", () => {
  const asOf = new Date(2026, 6, 1);

  it("verilen gün içinde dolacak bakiyeyi toplar", () => {
    const lots = [
      lot("yakin", "2025-07-15", 100_00n), // 2026-07-15'te dolar
      lot("uzak", "2026-06-01", 200_00n), // 2027-06-01'de dolar
    ];
    expect(expiringSoon(lots, 30, asOf)).toBe(100_00n);
  });

  it("zaten dolmuş olanı saymaz", () => {
    const lots = [lot("dolmus", "2025-01-01", 100_00n)];
    expect(expiringSoon(lots, 30, asOf)).toBe(0n);
  });

  it("süresiz lotu saymaz", () => {
    expect(expiringSoon([lot("adj", "2020-01-01", 50_00n, null)], 30, asOf)).toBe(
      0n
    );
  });
});

describe("earnFromCollection — FR-49 / D-11", () => {
  it("%100 katsayı: net tahsilat kadar bakiye kazandırır", () => {
    expect(earnFromCollection(595_000_00n)).toBe(595_000_00n);
  });

  it("sıfır veya negatif tahsilatta kazanım yok", () => {
    expect(earnFromCollection(0n)).toBe(0n);
    expect(earnFromCollection(-100n)).toBe(0n);
  });
});
