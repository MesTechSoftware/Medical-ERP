import { describe, expect, it } from "vitest";
import {
  agingBucket,
  allocateFIFO,
  summarizeAging,
  validateManualAllocation,
  type OpenOrder,
} from "@/lib/allocation";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** Vadeleri kasıtlı olarak KARIŞIK sırada verilmiş açık siparişler. */
const orders: OpenOrder[] = [
  { id: "o-yeni", dueDate: d("2026-03-01"), outstanding: 300_00n },
  { id: "o-eski", dueDate: d("2026-01-01"), outstanding: 100_00n },
  { id: "o-orta", dueDate: d("2026-02-01"), outstanding: 200_00n },
];

describe("allocateFIFO — D-18: vadesi en eski önce", () => {
  it("🔴 en eski vadeli siparişten başlar (giriş sırası değil)", () => {
    const r = allocateFIFO(100_00n, orders);
    expect(r.allocations).toEqual([{ orderId: "o-eski", amount: 100_00n }]);
    expect(r.unallocated).toBe(0n);
  });

  it("birden fazla siparişe sırayla taşar", () => {
    const r = allocateFIFO(350_00n, orders);
    expect(r.allocations).toEqual([
      { orderId: "o-eski", amount: 100_00n },
      { orderId: "o-orta", amount: 200_00n },
      { orderId: "o-yeni", amount: 50_00n }, // kısmi
    ]);
    expect(r.unallocated).toBe(0n);
  });

  it("FR-25: kısmi tahsilat tek siparişi kısmen kapatır", () => {
    const r = allocateFIFO(40_00n, orders);
    expect(r.allocations).toEqual([{ orderId: "o-eski", amount: 40_00n }]);
    expect(r.unallocated).toBe(0n);
  });

  it("tüm borcu tam kapatır, artan kalmaz", () => {
    const r = allocateFIFO(600_00n, orders);
    expect(r.allocations.reduce((s, a) => s + a.amount, 0n)).toBe(600_00n);
    expect(r.unallocated).toBe(0n);
  });

  it("fazla ödeme unallocated olarak döner (avans)", () => {
    const r = allocateFIFO(700_00n, orders);
    expect(r.allocations.reduce((s, a) => s + a.amount, 0n)).toBe(600_00n);
    expect(r.unallocated).toBe(100_00n);
  });

  it("açık sipariş yoksa tamamı unallocated", () => {
    const r = allocateFIFO(50_00n, []);
    expect(r.allocations).toEqual([]);
    expect(r.unallocated).toBe(50_00n);
  });

  it("kapanmış (outstanding = 0) siparişleri atlar", () => {
    const r = allocateFIFO(100_00n, [
      { id: "kapali", dueDate: d("2025-01-01"), outstanding: 0n },
      { id: "acik", dueDate: d("2026-01-01"), outstanding: 100_00n },
    ]);
    expect(r.allocations).toEqual([{ orderId: "acik", amount: 100_00n }]);
  });

  it("eşit vadede deterministik sıralar (id'ye göre)", () => {
    const same = d("2026-01-01");
    const a = allocateFIFO(150_00n, [
      { id: "b", dueDate: same, outstanding: 100_00n },
      { id: "a", dueDate: same, outstanding: 100_00n },
    ]);
    expect(a.allocations[0].orderId).toBe("a");
  });

  it("sıfır veya negatif tahsilatı reddeder", () => {
    expect(() => allocateFIFO(0n, orders)).toThrow();
    expect(() => allocateFIFO(-1n, orders)).toThrow();
  });

  it("girdi dizisini MUTASYONA UĞRATMAZ", () => {
    const before = orders.map((o) => o.id);
    allocateFIFO(350_00n, orders);
    expect(orders.map((o) => o.id)).toEqual(before);
  });
});

describe("validateManualAllocation — admin düzeltmesi", () => {
  it("geçerli düzeltmeyi kabul eder", () => {
    const r = validateManualAllocation(
      300_00n,
      [{ orderId: "o-yeni", amount: 300_00n }],
      orders
    );
    expect(r.ok).toBe(true);
  });

  it("tahsilatı aşan toplam mahsubu reddeder", () => {
    const r = validateManualAllocation(
      100_00n,
      [
        { orderId: "o-eski", amount: 100_00n },
        { orderId: "o-orta", amount: 50_00n },
      ],
      orders
    );
    expect(r.ok).toBe(false);
  });

  it("siparişin kalan borcundan fazla mahsubu reddeder", () => {
    const r = validateManualAllocation(
      500_00n,
      [{ orderId: "o-eski", amount: 150_00n }], // kalan 100
      orders
    );
    expect(r.ok).toBe(false);
  });

  it("bilinmeyen siparişi reddeder", () => {
    const r = validateManualAllocation(
      100_00n,
      [{ orderId: "yok", amount: 100_00n }],
      orders
    );
    expect(r.ok).toBe(false);
  });

  it("sıfır/negatif mahsubu reddeder", () => {
    expect(
      validateManualAllocation(100_00n, [{ orderId: "o-eski", amount: 0n }], orders).ok
    ).toBe(false);
  });

  it("tahsilatın tamamını dağıtmamaya izin verir (kalan avans)", () => {
    const r = validateManualAllocation(
      500_00n,
      [{ orderId: "o-eski", amount: 100_00n }],
      orders
    );
    expect(r.ok).toBe(true);
  });
});

describe("agingBucket — FR-26 kovaları", () => {
  const asOf = d("2026-06-01");

  it("vadesi gelmemiş alacak NOT_DUE", () => {
    expect(agingBucket(d("2026-07-01"), asOf)).toBe("NOT_DUE");
  });

  it("vade GÜNÜ henüz gecikme sayılmaz", () => {
    expect(agingBucket(d("2026-06-01"), asOf)).toBe("NOT_DUE");
  });

  it("kova sınırlarını doğru ayırır", () => {
    expect(agingBucket(d("2026-05-31"), asOf)).toBe("D1_30"); // 1 gün
    expect(agingBucket(d("2026-05-02"), asOf)).toBe("D1_30"); // 30 gün
    expect(agingBucket(d("2026-05-01"), asOf)).toBe("D31_60"); // 31 gün
    expect(agingBucket(d("2026-04-02"), asOf)).toBe("D31_60"); // 60 gün
    expect(agingBucket(d("2026-04-01"), asOf)).toBe("D61_90"); // 61 gün
    expect(agingBucket(d("2026-03-03"), asOf)).toBe("D61_90"); // 90 gün
    expect(agingBucket(d("2026-03-02"), asOf)).toBe("D90_PLUS"); // 91 gün
  });

  // Vade bir İŞ TARİHİDİR; kova YEREL takvim gününe göre hesaplanır. Bu yüzden
  // burada bilerek yerel zamanlı tarih kuruyoruz (UTC ile kurmak, +03'te günü
  // kaydırıp testi anlamsızlaştırır).
  it("gün içindeki saat farkı kovayı kaydırmaz (yerel takvim günü bazlı)", () => {
    const due = new Date(2026, 4, 31, 23, 59); // 31 Mayıs, gece yarısına dakikalar kala
    const now = new Date(2026, 5, 1, 0, 1); // 1 Haziran, gece yarısını biraz geçe
    expect(agingBucket(due, now)).toBe("D1_30"); // 1 gün gecikme

    // Aynı gün içinde saat ne olursa olsun kova değişmez.
    expect(agingBucket(new Date(2026, 4, 31, 0, 0), new Date(2026, 5, 1, 23, 59))).toBe(
      "D1_30"
    );
  });
});

describe("summarizeAging", () => {
  const asOf = d("2026-06-01");

  it("alacakları doğru kovalara toplar", () => {
    const sum = summarizeAging(
      [
        { dueDate: d("2026-07-01"), outstanding: 100_00n }, // NOT_DUE
        { dueDate: d("2026-05-20"), outstanding: 200_00n }, // D1_30
        { dueDate: d("2026-05-20"), outstanding: 50_00n }, // D1_30
        { dueDate: d("2026-01-01"), outstanding: 300_00n }, // D90_PLUS
      ],
      asOf
    );
    expect(sum.NOT_DUE).toBe(100_00n);
    expect(sum.D1_30).toBe(250_00n);
    expect(sum.D31_60).toBe(0n);
    expect(sum.D90_PLUS).toBe(300_00n);
  });

  it("kapanmış alacakları saymaz", () => {
    const sum = summarizeAging(
      [{ dueDate: d("2026-01-01"), outstanding: 0n }],
      asOf
    );
    expect(sum.D90_PLUS).toBe(0n);
  });

  it("boş listede tüm kovalar sıfır", () => {
    const sum = summarizeAging([], asOf);
    expect(Object.values(sum).every((v) => v === 0n)).toBe(true);
  });
});
