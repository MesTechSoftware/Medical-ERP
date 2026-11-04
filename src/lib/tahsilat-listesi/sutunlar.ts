/**
 * Tahsilat tablosunun gizlenebilir sütunları (spec Ü-26 §3.4). Tarih, Belge no, Cari, Tutar, Durum ve İşlem
 * burada yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type TahsilatSutunu = "yontem" | "referans" | "komisyon" | "kaydeden";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<TahsilatSutunu>[] = [
  { anahtar: "yontem", baslik: "Yöntem" },
  { anahtar: "referans", baslik: "Referans" },
  { anahtar: "komisyon", baslik: "Komisyon" },
  { anahtar: "kaydeden", baslik: "Kaydeden" },
];

export const SUTUN_CEREZI = "tahsilat-sutunlar";
export const SUTUN_YOLU = "/collections";
