/**
 * Tahsilat mahsuplaşması ve alacak yaşlandırma — saf fonksiyonlar.
 *
 * D-18 / FR-24: tahsilat, **vadesi en eski siparişten başlayarak** otomatik
 * mahsup edilir (FIFO). Admin manuel düzeltebilir.
 * FR-25: kısmi tahsilat desteklenir; prim ve kongre kazanımı orantılı işlenir.
 *
 * Tutarların tamamı BigInt kuruştur (RULE-10).
 */

/** Mahsup edilebilecek açık sipariş. `outstanding` = kalan borç (brüt). */
export type OpenOrder = {
  id: string;
  dueDate: Date;
  outstanding: bigint;
};

export type Allocation = { orderId: string; amount: bigint };

export type AllocationResult = {
  allocations: Allocation[];
  /** Hiçbir siparişe yazılamayan kısım (fazla ödeme / avans). */
  unallocated: bigint;
};

/**
 * Tutarı açık siparişlere FIFO ile dağıtır: vadesi EN ESKİ olan önce kapanır.
 * Eşit vadede sipariş id'sine göre kararlı (deterministik) sıralanır.
 */
export function allocateFIFO(
  amount: bigint,
  openOrders: readonly OpenOrder[]
): AllocationResult {
  if (amount <= 0n) throw new Error("Tahsilat tutarı sıfırdan büyük olmalıdır.");

  const sorted = [...openOrders]
    .filter((o) => o.outstanding > 0n)
    .sort((a, b) => {
      const d = a.dueDate.getTime() - b.dueDate.getTime();
      return d !== 0 ? d : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  const allocations: Allocation[] = [];
  let remaining = amount;

  for (const order of sorted) {
    if (remaining === 0n) break;
    const applied = remaining < order.outstanding ? remaining : order.outstanding;
    allocations.push({ orderId: order.id, amount: applied });
    remaining -= applied;
  }

  return { allocations, unallocated: remaining };
}

/**
 * Manuel mahsup düzeltmesini doğrular (FR-24 "admin manuel düzeltebilir").
 * Toplam dağıtım tahsilatı aşamaz ve hiçbir sipariş fazla kapatılamaz.
 */
export function validateManualAllocation(
  amount: bigint,
  allocations: readonly Allocation[],
  openOrders: readonly OpenOrder[]
): { ok: true } | { ok: false; reason: string } {
  const byId = new Map(openOrders.map((o) => [o.id, o]));
  let total = 0n;

  for (const a of allocations) {
    if (a.amount <= 0n) {
      return { ok: false, reason: "Mahsup tutarı sıfırdan büyük olmalıdır." };
    }
    const order = byId.get(a.orderId);
    if (!order) {
      return { ok: false, reason: "Mahsup edilen sipariş açık listede yok." };
    }
    if (a.amount > order.outstanding) {
      return {
        ok: false,
        reason: "Bir siparişe kalan borcundan fazla mahsup edilemez.",
      };
    }
    total += a.amount;
  }

  if (total > amount) {
    return { ok: false, reason: "Mahsup toplamı tahsilat tutarını aşamaz." };
  }
  return { ok: true };
}

/** Yaşlandırma kovaları (FR-26). */
export type AgingBucket =
  | "NOT_DUE"
  | "D1_30"
  | "D31_60"
  | "D61_90"
  | "D90_PLUS";

export const AGING_LABELS: Record<AgingBucket, string> = {
  NOT_DUE: "Vadesi gelmemiş",
  D1_30: "1-30 gün",
  D31_60: "31-60 gün",
  D61_90: "61-90 gün",
  D90_PLUS: "90+ gün",
};

export const AGING_ORDER: AgingBucket[] = [
  "NOT_DUE",
  "D1_30",
  "D31_60",
  "D61_90",
  "D90_PLUS",
];

/** Gün farkı (takvim günü bazında, saat farkları kovayı kaydırmasın diye). */
function daysOverdue(dueDate: Date, asOf: Date): number {
  const d1 = Date.UTC(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );
  const d2 = Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  return Math.floor((d2 - d1) / 86_400_000);
}

/** Vadesine göre alacağın hangi yaşlandırma kovasına düştüğünü belirler. */
export function agingBucket(dueDate: Date, asOf: Date = new Date()): AgingBucket {
  const days = daysOverdue(dueDate, asOf);
  if (days <= 0) return "NOT_DUE"; // vade günü henüz gecikme değildir
  if (days <= 30) return "D1_30";
  if (days <= 60) return "D31_60";
  if (days <= 90) return "D61_90";
  return "D90_PLUS";
}

/** Açık alacakları kovalara toplar (FR-26). */
export function summarizeAging(
  orders: readonly { dueDate: Date; outstanding: bigint }[],
  asOf: Date = new Date()
): Record<AgingBucket, bigint> {
  const out: Record<AgingBucket, bigint> = {
    NOT_DUE: 0n,
    D1_30: 0n,
    D31_60: 0n,
    D61_90: 0n,
    D90_PLUS: 0n,
  };
  for (const o of orders) {
    if (o.outstanding <= 0n) continue;
    out[agingBucket(o.dueDate, asOf)] += o.outstanding;
  }
  return out;
}
