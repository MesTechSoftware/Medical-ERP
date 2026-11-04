/**
 * Denetim tablosunun gizlenebilir sütunları (spec Ü-28 §3.3). Zaman, Kullanıcı, İşlem türü ve Detay gizlenemez.
 * Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type DenetimSutunu = "modul" | "ozet";

export const SUTUNLAR: readonly SutunTanimi<DenetimSutunu>[] = [
  { anahtar: "modul", baslik: "Modül / varlık" },
  { anahtar: "ozet", baslik: "Özet" },
];

export const SUTUN_CEREZI = "denetim-sutunlar";
export const SUTUN_YOLU = "/audit-logs";
