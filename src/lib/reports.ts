import { divRound } from "@/lib/money";

/**
 * Rapor yardımcıları — saf fonksiyonlar (FR-62, FR-63).
 *
 * Oranlar 2 ondalık hassasiyetle yüzde döner (ör. 42.5 = %42,5).
 * Parasal payların hepsi BigInt kuruştur.
 */

/** `part / whole` yüzdesi. `whole` sıfırsa 0 (sıfıra bölme yok). */
export function ratePercent(part: bigint, whole: bigint): number {
  if (whole <= 0n) return 0;
  return Number(divRound(part * 10000n, whole)) / 100;
}

/**
 * Tahsilat oranı: tahsil edilen / faturalanan (brüt). FR-62.
 * Satıcının tahsilat performansını gösterir; primi etkilemez (D-25).
 */
export function collectionRate(collected: bigint, billed: bigint): number {
  return ratePercent(collected, billed);
}

/**
 * Ortalama iskonto: kalemlerin net satış tutarı ağırlıklı ortalama iskonto.
 * `Σ(iskontolu fark) / Σ(liste tutarı)`. Kalem bazlı basit ortalama değil,
 * TUTAR AĞIRLIKLI — büyük siparişler ortalamayı daha çok etkiler.
 */
export function weightedDiscount(
  items: readonly { listPriceAtSale: bigint; netUnitPrice: bigint; quantity: number }[]
): number {
  let listTotal = 0n;
  let discountTotal = 0n;
  for (const it of items) {
    const q = BigInt(it.quantity);
    listTotal += it.listPriceAtSale * q;
    discountTotal += (it.listPriceAtSale - it.netUnitPrice) * q;
  }
  return ratePercent(discountTotal, listTotal);
}

/** KDV görünümüne göre ciro alanını seçer (FR-64). */
export function ciroField(mode: "NET" | "GROSS"): "netTotal" | "grossTotal" {
  return mode === "NET" ? "netTotal" : "grossTotal";
}
