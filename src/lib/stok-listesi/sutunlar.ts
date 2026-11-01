/**
 * Stok hareket tablosunun gizlenebilir sütunları (spec Ü-20 §3.4–3.5). Tarih, Ürün ve Miktar burada
 * yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type StokSutunu = "tur" | "konum" | "aciklama" | "yapan";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<StokSutunu>[] = [
  { anahtar: "tur", baslik: "Tür" },
  { anahtar: "konum", baslik: "Konum" },
  { anahtar: "aciklama", baslik: "Açıklama" },
  { anahtar: "yapan", baslik: "İşlemi yapan" },
];

export const SUTUN_CEREZI = "stok-sutunlar";
export const SUTUN_YOLU = "/stock";
