/**
 * Parti tablosunun gizlenebilir sütunları (spec Ü-30 §3.3). Parti, Tür, Zaman, Kayıt, Durum ve İşlem gizlenemez.
 * Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type PartiSutunu = "dosya" | "yapan";

export const SUTUNLAR: readonly SutunTanimi<PartiSutunu>[] = [
  { anahtar: "dosya", baslik: "Dosya" },
  { anahtar: "yapan", baslik: "Yapan" },
];

export const SUTUN_CEREZI = "ice-aktarim-sutunlar";
