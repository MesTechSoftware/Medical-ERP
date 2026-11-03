/**
 * Sipariş tablosunun gizlenebilir sütunları (spec Ü-23 §3.4). Tarih, Cari, Durum ve İşlem burada
 * yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

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
