/**
 * Sipariş tablosunun gizlenebilir sütunları (spec Ü-23 §3.4). Tarih, Cari, Durum ve İşlem burada
 * yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";
import type { SiparisYolu } from "@/lib/siparis-listesi/suzgec";

export type SiparisSutunu = "belgeNo" | "klinik" | "satici" | "tutar" | "sevk";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<SiparisSutunu>[] = [
  { anahtar: "belgeNo", baslik: "Belge no" },
  { anahtar: "klinik", baslik: "Klinik" },
  { anahtar: "satici", baslik: "Satıcı" },
  { anahtar: "tutar", baslik: "Tutar" },
  { anahtar: "sevk", baslik: "Sevk" },
];

export const SUTUN_CEREZI = "siparis-sutunlar";
export const SUTUN_YOLU = "/orders";

/**
 * Siparişlerim (satıcı, Ü-31): satıcı sütunu yoktur — liste yalnız kendi siparişleridir. Tercih ayrı çerezde,
 * kendi yolunda durur; yöneticinin seçimini etkilemez.
 */
export const SATICI_SUTUNLARI: readonly SutunTanimi<SiparisSutunu>[] = SUTUNLAR.filter((s) => s.anahtar !== "satici");
export const SATICI_SUTUN_CEREZI = "siparislerim-sutunlar";
export const SATICI_SUTUN_YOLU = "/my-orders";

/** Ekranın sütun seti yolundan türer (kart seti gibi): satıcı ekranı satıcı sütununu hiç çizmez. */
export function ekranSutunlari(yol: SiparisYolu): readonly SutunTanimi<SiparisSutunu>[] {
  return yol === "/orders" ? SUTUNLAR : SATICI_SUTUNLARI;
}
