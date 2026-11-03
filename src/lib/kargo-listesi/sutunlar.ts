/**
 * Sevkiyat listesinin gizlenebilir sütunları (spec Ü-24 §3.5). Gönderi, Belge no, Cari ve Durum burada
 * yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type KargoSutunu = "siparis" | "firma" | "takip" | "irsaliye" | "adet";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<KargoSutunu>[] = [
  { anahtar: "siparis", baslik: "Sipariş" },
  { anahtar: "firma", baslik: "Firma" },
  { anahtar: "takip", baslik: "Takip no" },
  { anahtar: "irsaliye", baslik: "İrsaliye" },
  { anahtar: "adet", baslik: "Adet" },
];

export const SUTUN_CEREZI = "kargo-sutunlar";
export const SUTUN_YOLU = "/shipping";
