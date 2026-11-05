/**
 * Fiyat listesi tablosunun gizlenebilir sütunları (spec Ü-21 §3.4). Kod ve İşlem burada yoktur —
 * gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type ListeSutunu = "ad" | "urun" | "barem" | "cari" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<ListeSutunu>[] = [
  { anahtar: "ad", baslik: "Ad" },
  { anahtar: "urun", baslik: "Ürün" },
  { anahtar: "barem", baslik: "Barem" },
  { anahtar: "cari", baslik: "Atanmış cari" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "fiyat-listesi-sutunlar";
