/**
 * Sunucu tarafı girdi doğrulama şemaları (Zod).
 *
 * Kapsam bilinçli olarak **para/miktar-kritik** alanlarla sınırlıdır. Finansal
 * veri (kuruş/integer cari) UI doğrulamasına güvenilemez: negatif, ondalıklı
 * kuruş, taşma veya format-dışı girdi cariyi sessizce bozar. Tüm formları Zod'a
 * taşımak hedef değildir; diğer alanlar mevcut kontrollerini korur.
 */
import { z } from "zod";

/** TL değeri tam kuruşa oturuyor mu? (12,34 ✓ — 12,345 ✗) */
const isWholeKurus = (v: number) =>
  Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

// 10 milyar TL üst sınırı: makul olmayan/taşma girdilerini eler.
const MAX_TL = 1_000_000_000;

/** Ödeme tutarı: > 0, tam kuruş, makul sınır. (z.number() NaN/Infinity'yi eler.) */
export const amountTLSchema = z
  .number()
  .gt(0)
  .max(MAX_TL)
  .refine(isWholeKurus);

/** Ürün satış fiyatı: >= 0 (ücretsiz olabilir), tam kuruş. */
export const priceTLSchema = z
  .number()
  .min(0)
  .max(MAX_TL)
  .refine(isWholeKurus);

/** Miktar/adet: pozitif tam sayı. */
export const quantitySchema = z.number().int().gt(0).max(1_000_000);
