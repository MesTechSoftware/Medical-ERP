/**
 * Ürün listesinin gizlenebilir sütunları (spec Ü-19 §3.3–3.4). Ürün ve İşlem burada yoktur —
 * gizlenemez. KDV dahil liste fiyatı varsayılan gizlidir. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type UrunSutunu = "kod" | "fiyat" | "fiyatKdvDahil" | "kdv" | "stok" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<UrunSutunu>[] = [
  { anahtar: "kod", baslik: "Kod" },
  { anahtar: "fiyat", baslik: "Liste Fiyatı (KDV hariç)" },
  { anahtar: "fiyatKdvDahil", baslik: "Liste Fiyatı (KDV dahil)", varsayilanGizli: true },
  { anahtar: "kdv", baslik: "KDV" },
  { anahtar: "stok", baslik: "Stok" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "urun-sutunlar";
export const SUTUN_YOLU = "/products";
