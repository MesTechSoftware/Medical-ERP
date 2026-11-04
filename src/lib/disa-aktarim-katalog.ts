/**
 * Dışa aktarım veri setlerinin kapalı kataloğu (D-5) — sunucu (`disa-aktarim.ts`, `disaAktar`) ve ekran aynı listeyi
 * okur. Saf modül: istemci bileşeni de içe aktarır.
 */
export const VERI_SETLERI = ["CARI_HAREKET", "TAHSILAT", "SIPARIS", "STOK", "DOKTOR_LISTESI", "FATURA_HAZIRLIK"] as const;
export type VeriSeti = (typeof VERI_SETLERI)[number];

/** Dönem isteyen (aralık okuyan) veri setleri — D-5 §(3). */
export const ARALIKLI: readonly VeriSeti[] = ["CARI_HAREKET", "TAHSILAT", "SIPARIS", "FATURA_HAZIRLIK"];
