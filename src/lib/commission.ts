/**
 * Prim hesabı C4'te söküldü (GÇ-1 + GÇ-16): matrah tahsilata değil sevkiyata
 * bağlanır (X-1 §(7), A-3); yeni prim kodu 1B'de yazılır.
 *
 * Kalan tek sabit C7'de `policy.ts` `finance.primOraniVarsayilan`'a taşınır (X-14).
 */

/** Varsayılan prim oranı (%). Satıcı bazında override edilebilir (FR-30, FR-31). */
export const DEFAULT_COMMISSION_RATE = 5;
