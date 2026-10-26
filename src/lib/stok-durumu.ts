/** Kritik stok eşiği — ürün listesi ve dashboard aynı değeri kullanır. */
export const CRITICAL_STOCK = 10;

/**
 * Stok miktarının ekrandaki durumu (ADR-009, iki seviye): tükenmiş hata, eşik altı uyarı.
 * Negatif stok engellenmez (B-4) ve tükenmiş sayılır. Durumsuz miktarda `null`.
 */
export function stokDurumu(miktar: number): { ton: "hata" | "uyari"; etiket: string } | null {
  if (miktar <= 0) return { ton: "hata", etiket: "Tükendi" };
  if (miktar <= CRITICAL_STOCK) return { ton: "uyari", etiket: "Kritik" };
  return null;
}
