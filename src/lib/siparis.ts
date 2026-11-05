import type Decimal from "decimal.js";
import { hesaplaSatirTutarlari, type BelgeTutari, type SatirTutari } from "@/lib/satir-tutarlari";

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

/** Satır tutarları ve belge toplamı tek hesaptan (yan panel satır matrahını da buradan okur). */
export function siparisTutarlari(satirlar: readonly Satir[]): { satirlar: SatirTutari[]; toplam: BelgeTutari } {
  return hesaplaSatirTutarlari(
    satirlar.map((s) => ({
      birimFiyat: s.unitPrice,
      listeFiyat: s.listPrice,
      kdvOrani: s.vatRate,
      miktar: s.quantity,
      bedelsiz: s.isFree,
    }))
  );
}

export function siparisToplami(satirlar: readonly Satir[]): BelgeTutari {
  return siparisTutarlari(satirlar).toplam;
}

type KalemHareketleri = {
  quantity: number;
  shipmentItems: readonly { quantity: number }[];
  returnItems: readonly { quantity: number }[];
};

/** Kalemin sevk edilen miktarı — kalan hesabının ve liste satırının (iadesiz okuma) tek yolu. */
export function sevkMiktari(k: { shipmentItems: readonly { quantity: number }[] }): number {
  return k.shipmentItems.reduce((t, s) => t + s.quantity, 0);
}

/** Kalemin sevk edilmemiş miktarı: sipariş − sevk (A-3); iade kalanı değiştirmez (A-1), okunması gerekmez. */
export function kalanMiktar(k: { quantity: number; shipmentItems: readonly { quantity: number }[] }): number {
  return k.quantity - sevkMiktari(k);
}

/**
 * Kalem başına sevk edilen, iade edilen ve kalan miktar (A-3-2). Kalan = sipariş − sevk (A-3);
 * iade ayrı belgedir ve kalanı değiştirmez (A-1). Sipariş yan paneli buradan okur; liste satırı `sevkMiktari`,
 * Kargo, onay, risk ve `sevkiyatYaz` kalanı iadesiz `kalanMiktar`'dan okur.
 */
export function kalemMiktarlari(k: KalemHareketleri): { sevk: number; iade: number; kalan: number } {
  const sevk = sevkMiktari(k);
  const iade = k.returnItems.reduce((t, r) => t + r.quantity, 0);
  return { sevk, iade, kalan: kalanMiktar(k) };
}
