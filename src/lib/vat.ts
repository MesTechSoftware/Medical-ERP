/**
 * KDV (Katma Değer Vergisi) hesaplamaları.
 *
 * KANONİK DEĞER NET'TİR (KDV hariç), BigInt kuruş cinsinden — bkz. PRD RULE-10.
 * KDV ve brüt tutar bundan türetilir ve sipariş anında snapshot'lanır (RULE-04).
 *
 * 🔴 YUVARLAMA KURALI: KDV **kalem bazında** yuvarlanır, sipariş toplamında
 * değil. Sipariş toplamları kalem değerlerinin TOPLAMIDIR; yeniden hesaplanmaz.
 * Aksi halde "kalemler toplamı ≠ sipariş toplamı" farkı çıkar ve fatura tutmaz.
 */

import { divRound } from "@/lib/money";

/** Sistem varsayılanı KDV oranı (%). Ürün bazında override edilebilir (FR-16). */
export const DEFAULT_VAT_RATE = 20;

function assertRate(rate: number): bigint {
  if (!Number.isInteger(rate) || rate < 0 || rate > 100) {
    throw new Error(`Geçersiz KDV oranı: ${rate}`);
  }
  return BigInt(rate);
}

/** Net tutar üzerinden KDV tutarını hesaplar. */
export function vatAmount(net: bigint, rate: number): bigint {
  return divRound(net * assertRate(rate), 100n);
}

/** Net tutardan brüt (KDV dahil) tutarı hesaplar. */
export function grossFromNet(net: bigint, rate: number): bigint {
  return net + vatAmount(net, rate);
}

/**
 * Brüt (KDV dahil) tutardan net tutarı geri hesaplar.
 * Kullanıcı "KDV Dahil" modunda fiyat girdiğinde giriş noktasında çağrılır.
 */
export function netFromGross(gross: bigint, rate: number): bigint {
  const r = assertRate(rate);
  return divRound(gross * 100n, 100n + r);
}

export type LineTotals = {
  lineNetTotal: bigint;
  vatAmount: bigint;
  lineGrossTotal: bigint;
};

/**
 * Bir sipariş kaleminin tutarlarını hesaplar. Yuvarlama BURADA yapılır —
 * sipariş toplamı bu değerlerin toplamıdır, yeniden yuvarlanmaz.
 */
export function lineTotals(
  netUnitPrice: bigint,
  quantity: number,
  rate: number
): LineTotals {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Geçersiz miktar: ${quantity}`);
  }
  const lineNetTotal = netUnitPrice * BigInt(quantity);
  const vat = vatAmount(lineNetTotal, rate);
  return {
    lineNetTotal,
    vatAmount: vat,
    lineGrossTotal: lineNetTotal + vat,
  };
}

export type OrderTotals = {
  netTotal: bigint;
  vatTotal: bigint;
  grossTotal: bigint;
};

/** Sipariş toplamları = kalem toplamlarının TOPLAMI (yeniden yuvarlama yok). */
export function sumLineTotals(lines: readonly LineTotals[]): OrderTotals {
  return lines.reduce<OrderTotals>(
    (acc, l) => ({
      netTotal: acc.netTotal + l.lineNetTotal,
      vatTotal: acc.vatTotal + l.vatAmount,
      grossTotal: acc.grossTotal + l.lineGrossTotal,
    }),
    { netTotal: 0n, vatTotal: 0n, grossTotal: 0n }
  );
}

/**
 * Liste fiyatına göre iskonto oranı (yüzde, 2 ondalık → baz puan/100).
 * Örn. 1000 → 850 için 15.00 döner. Liste fiyatı 0 ise iskonto 0'dır (FR-14).
 */
export function discountRate(
  netListPrice: bigint,
  netUnitPrice: bigint
): number {
  if (netListPrice <= 0n) return 0;
  const diff = netListPrice - netUnitPrice;
  // 2 ondalık hassasiyet için 10000 ile ölçekleyip geri bölüyoruz.
  return Number(divRound(diff * 10000n, netListPrice)) / 100;
}
