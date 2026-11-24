/**
 * Sunucu tarafı girdi doğrulama şemaları (Zod).
 *
 * Kapsam bilinçli olarak **para/miktar-kritik** alanlarla sınırlıdır. Finansal
 * veri UI doğrulamasına güvenilemez: negatif, fazla ondalıklı, taşma veya
 * format-dışı girdi cariyi sessizce bozar. Tüm formları Zod'a taşımak hedef
 * değildir; diğer alanlar mevcut kontrollerini korur.
 *
 * Parasal girdiler METİN olarak gelir ve `Decimal`e çevrilir; float'a hiç düşmez (X-5).
 */
import Decimal from "decimal.js";
import { z } from "zod";

// 1 milyar TL üst sınırı: makul olmayan girdileri eler ("akla yatkınlık" sınırı).
const MAX_TL = new Decimal(1_000_000_000);

/** "1250,5" | "1250.5" → Decimal; en fazla `ondalik` hane. */
function paraSemasi(ondalik: number) {
  const desen = new RegExp(`^\\d+([.,]\\d{1,${ondalik}})?$`);
  return z
    .string()
    .trim()
    .regex(desen)
    .transform((t) => new Decimal(t.replace(",", ".")))
    .refine((d) => d.lte(MAX_TL));
}

/** Ödeme tutarı: > 0, en fazla 2 ondalık (tutar ölçeği, X-5 §(1)). */
export const amountSchema = paraSemasi(2).refine((d) => d.gt(0));

/** Kredi limiti: >= 0, en fazla 2 ondalık; 0 = peşin çalışılan cari (A-12-7). */
export const creditLimitSchema = paraSemasi(2);

/** Birim fiyat: >= 0 (ücretsiz olabilir), en fazla 4 ondalık (X-5 §(1)). */
export const priceSchema = paraSemasi(4);

/** Miktar/adet: pozitif tam sayı (X-5 §(8)). */
export const quantitySchema = z.number().int().gt(0).max(1_000_000);
