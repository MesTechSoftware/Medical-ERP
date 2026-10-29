/**
 * Ürün listesinin gizlenebilir sütunları (spec Ü-19 §3.3–3.4). Ürün ve İşlem burada yoktur —
 * gizlenemez. KDV dahil liste fiyatı varsayılan gizlidir. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";

export type UrunSutunu = "kod" | "fiyat" | "fiyatKdvDahil" | "kdv" | "stok" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<UrunSutunu>[] = [
  { anahtar: "kod", baslik: "Kod" },
  { anahtar: "fiyat", baslik: tabanli("Liste Fiyatı", MATRAH) },
  { anahtar: "fiyatKdvDahil", baslik: tabanli("Liste Fiyatı", BRUT), varsayilanGizli: true },
  { anahtar: "kdv", baslik: "KDV" },
  { anahtar: "stok", baslik: "Stok" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "urun-sutunlar";
export const SUTUN_YOLU = "/products";
