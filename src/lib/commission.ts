import { divRound } from "@/lib/money";

/**
 * Satıcı primi (komisyon) — saf fonksiyonlar.
 *
 * D-16 / FR-33: matrah dönem içinde **TAHSİL EDİLEN** tutardır (sipariş değil).
 * D-17: matrah **KDV HARİÇ (net)** hesaplanır — KDV devlete aittir.
 * D-19 / FR-25: kısmi tahsilatta orantılıdır.
 * FR-32: dönem takvim ayıdır.
 * RULE-05: kapanmış dönem asla değişmez; düzeltmeler sonraki döneme yazılır.
 *
 * 🔴 Prim SATICININ hak edişidir; kongre bakiyesi DOKTORUN hak edişidir.
 * İkisi aynı tahsilatla tetiklenir ama birbirinden bağımsızdır (D-19).
 */

/** Varsayılan prim oranı (%). Satıcı bazında override edilebilir (FR-30, FR-31). */
export const DEFAULT_COMMISSION_RATE = 5;

export type Period = { year: number; month: number }; // month: 1-12

/** Bir tarihin ait olduğu prim dönemi (takvim ayı — FR-32). */
export function periodOf(date: Date): Period {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Dönemi bir ay ileri alır (yıl sınırını doğru geçer). */
export function nextPeriod(p: Period): Period {
  return p.month === 12
    ? { year: p.year + 1, month: 1 }
    : { year: p.year, month: p.month + 1 };
}

/** a dönemi b'den önce mi? */
export function isPeriodBefore(a: Period, b: Period): boolean {
  return a.year !== b.year ? a.year < b.year : a.month < b.month;
}

export function periodEquals(a: Period, b: Period): boolean {
  return a.year === b.year && a.month === b.month;
}

export function formatPeriod(p: Period): string {
  return `${String(p.month).padStart(2, "0")}/${p.year}`;
}

/**
 * Bir mahsubun NET (KDV hariç) karşılığı.
 *
 * Tahsilat BRÜT yapılır; prim matrahı ise nettir (D-17). Kısmi tahsilatta
 * net pay ORANTILI hesaplanır (D-19): mahsup × (siparişNet / siparişBrüt).
 */
export function netPortionOfAllocation(
  allocationAmount: bigint,
  orderNetTotal: bigint,
  orderGrossTotal: bigint
): bigint {
  if (orderGrossTotal <= 0n) return 0n;
  return divRound(allocationAmount * orderNetTotal, orderGrossTotal);
}

/** Prim tutarı = matrah × oran / 100. Negatif matrah (düzeltme) desteklenir. */
export function commissionAmount(base: bigint, ratePercent: number): bigint {
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new Error(`Geçersiz prim oranı: ${ratePercent}`);
  }
  // Oran ondalıklı olabilir (%5,5); 2 ondalık hassasiyetle tam sayıya taşınır.
  const scaled = BigInt(Math.round(ratePercent * 100));
  return divRound(base * scaled, 10_000n);
}

export type CommissionInput = {
  /** Dönem içindeki mahsupların net karşılıkları. */
  netAllocations: readonly bigint[];
  /** Önceki dönemlerden taşınan düzeltmeler (±, net matrah) — FR-35. */
  adjustments?: readonly bigint[];
  ratePercent: number;
};

export type CommissionResult = {
  baseAmount: bigint;
  adjustmentTotal: bigint;
  ratePercent: number;
  commissionAmount: bigint;
};

/** Bir dönemin prim hesabı. */
export function calculateCommission(
  input: CommissionInput
): CommissionResult {
  const collected = input.netAllocations.reduce((s, v) => s + v, 0n);
  const adjustmentTotal = (input.adjustments ?? []).reduce((s, v) => s + v, 0n);
  const baseAmount = collected + adjustmentTotal;
  return {
    baseAmount,
    adjustmentTotal,
    ratePercent: input.ratePercent,
    commissionAmount: commissionAmount(baseAmount, input.ratePercent),
  };
}
