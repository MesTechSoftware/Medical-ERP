/**
 * Kullanıcı tablosunun gizlenebilir sütunları (spec Ü-22 §3.4). Kullanıcı ve İşlem burada yoktur —
 * gizlenemez. Varsayılan gizli sütun yoktur. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type KullaniciSutunu = "rol" | "iletisim" | "portfoy" | "sonEtkinlik" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<KullaniciSutunu>[] = [
  { anahtar: "rol", baslik: "Rol" },
  { anahtar: "iletisim", baslik: "İletişim" },
  { anahtar: "portfoy", baslik: "Portföy" },
  { anahtar: "sonEtkinlik", baslik: "Son etkinlik" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "kullanici-sutunlar";
