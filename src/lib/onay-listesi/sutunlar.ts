/**
 * Onay tablosunun gizlenebilir sütunları (spec Ü-25 §3.4). Açılış, Kural, Belge, Durum ve İşlem burada
 * yoktur — gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type OnaySutunu = "cari" | "acan" | "gerekce" | "kararVeren" | "kararZamani";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<OnaySutunu>[] = [
  { anahtar: "cari", baslik: "Cari" },
  { anahtar: "acan", baslik: "Açan" },
  { anahtar: "gerekce", baslik: "Gerekçe" },
  { anahtar: "kararVeren", baslik: "Karar veren" },
  { anahtar: "kararZamani", baslik: "Karar zamanı" },
];

export const SUTUN_CEREZI = "onay-sutunlar";
export const SUTUN_YOLU = "/approvals";
