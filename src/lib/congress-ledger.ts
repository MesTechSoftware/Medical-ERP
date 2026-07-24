/**
 * Kongre bakiyesi defteri — saf fonksiyonlar.
 *
 * Model: her tahsilat doktora bir "lot" (EARN) kazandırır. Harcama FIFO ile
 * EN ESKİ lottan düşer (RULE-11). Her lot kazanımdan itibaren 12 ay geçerlidir
 * (D-22, rolling — takvim yılı sonu sıfırlaması DEĞİL).
 *
 * RULE-08: bakiye ayrı kolonda tutulmaz; lotların kalanından hesaplanır.
 * RULE-07: bakiye negatife düşürülerek harcama yapılamaz.
 *
 * 🔴 Kongre bakiyesi DOKTORUN hak edişidir; prim SATICININ hak edişidir.
 * Aynı tahsilat ikisini de tetikler ama birbirinden bağımsızdır (D-19).
 */

/** Kazanım lotu: FIFO tüketimi `remainingAmount` üzerinden yürür. */
export type LedgerLot = {
  id: string;
  earnedAt: Date;
  /** null = süresiz (manuel ADJUST için). */
  expiresAt: Date | null;
  remainingAmount: bigint;
};

/** Kazanım katsayısı %100 (D-11): 1 ₺ tahsilat = 1 ₺ kongre bakiyesi. */
export const EARN_RATE_PERCENT = 100;

/** Bakiye geçerlilik süresi (ay) — D-10 / D-22. */
export const EXPIRY_MONTHS = 12;

/**
 * Kazanımın son kullanma tarihi: kazanım + 12 ay (rolling).
 *
 * Ay sonu taşmasını engeller: 31 Ocak + 12 ay → 31 Ocak (sorun yok) ama
 * 29 Şubat (artık yıl) + 12 ay → 28 Şubat'a KIRPILIR; aksi halde JS tarihi
 * 1 Mart'a taşır ve doktora bir gün fazladan süre verirdi.
 */
export function expiryFor(earnedAt: Date): Date {
  const y = earnedAt.getFullYear();
  const m = earnedAt.getMonth();
  const d = earnedAt.getDate();

  const targetYear = y + Math.floor((m + EXPIRY_MONTHS) / 12);
  const targetMonth = (m + EXPIRY_MONTHS) % 12;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();

  const result = new Date(earnedAt);
  result.setFullYear(targetYear, targetMonth, Math.min(d, lastDay));
  return result;
}

/** Lot süresi dolmuş mu? */
export function isExpired(lot: LedgerLot, asOf: Date = new Date()): boolean {
  return lot.expiresAt !== null && lot.expiresAt.getTime() <= asOf.getTime();
}

/** Kullanılabilir bakiye: süresi dolmamış lotların kalan toplamı (RULE-08). */
export function availableBalance(
  lots: readonly LedgerLot[],
  asOf: Date = new Date()
): bigint {
  return lots.reduce(
    (sum, lot) =>
      lot.remainingAmount > 0n && !isExpired(lot, asOf)
        ? sum + lot.remainingAmount
        : sum,
    0n
  );
}

/** Süresi dolmuş ama henüz EXPIRE yazılmamış lotlar (gecelik job için). */
export function expiredLots(
  lots: readonly LedgerLot[],
  asOf: Date = new Date()
): LedgerLot[] {
  return lots.filter((l) => l.remainingAmount > 0n && isExpired(l, asOf));
}

/** FR-59: `days` gün içinde süresi dolacak bakiye (satış aracı uyarısı). */
export function expiringSoon(
  lots: readonly LedgerLot[],
  days: number,
  asOf: Date = new Date()
): bigint {
  const limit = new Date(asOf);
  limit.setDate(limit.getDate() + days);
  return lots.reduce((sum, lot) => {
    if (lot.remainingAmount <= 0n || isExpired(lot, asOf)) return sum;
    if (lot.expiresAt === null) return sum;
    return lot.expiresAt <= limit ? sum + lot.remainingAmount : sum;
  }, 0n);
}

export type Consumption = { lotId: string; amount: bigint };

export type SpendPlan = {
  consumptions: Consumption[];
  /** Bakiye yetmiyorsa eksik tutar (D-12: ekranda gösterilir). */
  shortfall: bigint;
};

/**
 * FIFO harcama planı: EN ESKİ kazanımdan başlayarak tüketir (RULE-11).
 *
 * Neden FIFO şart: en eski lot en önce yanacak lottur. LIFO tüketilseydi
 * doktorun bakiyesi dururken en eski kısım süresiz birikir ve geçerlilik
 * mantığı sessizce yanlış çalışırdı.
 *
 * Bakiye yetmezse plan BOŞ döner ve `shortfall` dolar — kısmi harcama YOKTUR
 * (RULE-07, D-12: sistem üzerinden fark ödemesi yapılamaz).
 */
export function planFifoSpend(
  amount: bigint,
  lots: readonly LedgerLot[],
  asOf: Date = new Date()
): SpendPlan {
  if (amount <= 0n) throw new Error("Harcama tutarı sıfırdan büyük olmalıdır.");

  const usable = lots
    .filter((l) => l.remainingAmount > 0n && !isExpired(l, asOf))
    .sort((a, b) => {
      const d = a.earnedAt.getTime() - b.earnedAt.getTime();
      return d !== 0 ? d : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  const total = usable.reduce((s, l) => s + l.remainingAmount, 0n);
  if (total < amount) {
    return { consumptions: [], shortfall: amount - total };
  }

  const consumptions: Consumption[] = [];
  let remaining = amount;
  for (const lot of usable) {
    if (remaining === 0n) break;
    const take = remaining < lot.remainingAmount ? remaining : lot.remainingAmount;
    consumptions.push({ lotId: lot.id, amount: take });
    remaining -= take;
  }
  return { consumptions, shortfall: 0n };
}

/**
 * FR-49 / D-11: tahsilattan doğan kongre kazanımı.
 * Matrah KDV HARİÇ nettir (D-17) ve katsayı %100'dür.
 */
export function earnFromCollection(netCollected: bigint): bigint {
  if (netCollected <= 0n) return 0n;
  return (netCollected * BigInt(EARN_RATE_PERCENT)) / 100n;
}
