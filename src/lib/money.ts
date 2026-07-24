// Para birimi yardımcıları.
// Tüm parasal değerler veritabanında BigInt KURUŞ olarak saklanır.
// Örn: 150,50 TL -> 15050n kuruş.
//
// Neden BigInt: PostgreSQL'de Prisma `Int` = 4 baytlık INTEGER = ±21,5 M ₺
// tavanı demektir. KDV ve kümülatif ciro ile bu tavan gerçek bir risktir.
// Görüntüleme sırasında Number'a düşmek güvenlidir: 2^53 kuruş ≈ 90 trilyon TL,
// yani ulaşılabilir hiçbir tutar hassasiyet kaybetmez.

/** Kuruş değerini "1.250,50 ₺" biçiminde Türk Lirası metnine çevirir. */
export function formatTRY(kurus: bigint | number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(kurus) / 100);
}

/** TL cinsinden (ondalıklı) bir tutarı kuruşa (BigInt) çevirir. */
export function tlToKurus(tl: number): bigint {
  return BigInt(Math.round(tl * 100));
}

/** Kuruş değerini TL cinsine (ondalıklı sayı) çevirir. */
export function kurusToTl(kurus: bigint | number): number {
  return Number(kurus) / 100;
}

/**
 * Tam sayı bölme, yarımı sıfırdan uzağa yuvarlar (round-half-away-from-zero).
 * `(2n + d) / 2d` biçimi, `d/2`'nin tam sayı bölmesinde hassasiyet kaybetmesini önler.
 *
 * Parasal orantı hesaplarının TEK yuvarlama noktası: KDV (vat.ts) ve prim
 * matrahı (commission.ts) aynı kuralı kullansın diye burada tutulur.
 */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Sıfıra bölme.");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (2n * n + d) / (2n * d);
  return negative ? -q : q;
}

/** BigInt kuruş listesini toplar. Prisma `_sum` null dönebildiği için varsayılan 0n. */
export function sumKurus(values: Iterable<bigint | null | undefined>): bigint {
  let total = 0n;
  for (const v of values) total += v ?? 0n;
  return total;
}
