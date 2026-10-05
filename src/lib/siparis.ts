import type Decimal from "decimal.js";
import { hesaplaSatirTutarlari, type BelgeTutari } from "@/lib/satir-tutarlari";

/**
 * Sipariş toplamı saklanmaz; satırların donmuş değerlerinden türetilir (C-6 §(3), GÇ-18).
 * Ekranlar sipariş satırını bu seçimle okur ve toplamı buradan alır.
 */
export const SIPARIS_SATIRI = {
  quantity: true,
  listPrice: true,
  unitPrice: true,
  vatRate: true,
  isFree: true,
} as const;

type Satir = {
  quantity: number;
  listPrice: Decimal.Value;
  unitPrice: Decimal.Value;
  vatRate: Decimal.Value;
  isFree: boolean;
};

export function siparisToplami(satirlar: readonly Satir[]): BelgeTutari {
  return hesaplaSatirTutarlari(
    satirlar.map((s) => ({
      birimFiyat: s.unitPrice,
      listeFiyat: s.listPrice,
      kdvOrani: s.vatRate,
      miktar: s.quantity,
      bedelsiz: s.isFree,
    }))
  ).toplam;
}
