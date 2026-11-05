/**
 * Doktor ciro sıralamasının gizlenebilir sütunları (spec Ü-27 §3.2). Sıra, Cari ve Ciro gizlenemez.
 * Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type RaporSutunu = "satici" | "oran";

export const SUTUNLAR: readonly SutunTanimi<RaporSutunu>[] = [
  { anahtar: "satici", baslik: "Satıcı" },
  { anahtar: "oran", baslik: "Lidere göre" },
];

export const SUTUN_CEREZI = "rapor-sutunlar";
