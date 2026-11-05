/**
 * Cari listesinin gizlenebilir sütunları ve tercih çerezinin biçimi (spec Ü-18 §3.4). Ad Soyad ve
 * seçim kutusu burada yoktur — gizlenemez. Biçim `liste/sutunlar.ts`'tedir. Saf modül.
 */

import * as ortak from "@/lib/liste/sutunlar";
import type { SutunTanimi } from "@/lib/liste/sutunlar";

export type SutunAnahtari = "klinik" | "telefon" | "satici" | "siparis" | "sonSiparis" | "bakiye" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly SutunTanimi<SutunAnahtari>[] = [
  { anahtar: "klinik", baslik: "Klinik / Bölge" },
  { anahtar: "telefon", baslik: "Telefon" },
  { anahtar: "satici", baslik: "Sorumlu Satıcı" },
  { anahtar: "siparis", baslik: "Sipariş" },
  { anahtar: "sonSiparis", baslik: "Son Sipariş" },
  { anahtar: "bakiye", baslik: "Bakiye" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "doktor-sutunlar";

/** Bozuk ya da bilinmeyen değer yok sayılır: varsayılan, bütün sütunlar görünür. */
export function gizliSutunlariCoz(deger: string | undefined): ReadonlySet<SutunAnahtari> {
  return ortak.gizliSutunlariCoz(SUTUNLAR, deger);
}

export function gizliSutunCerezi(gizli: Iterable<string>): string {
  return ortak.gizliSutunCerezi(SUTUNLAR, gizli);
}

/** Kaydettikten sonra dönülecek adres: yalnız cari listesi, başkası listeye düşer (açık yönlendirme yok). */
export function guvenliDonus(donus: string): string {
  return ortak.guvenliDonus("/doctors", donus);
}

/** Doktorlarım (satıcı, Ü-32): sorumlu satıcı sütunu yoktur (hepsi kendisinin). Tercih ayrı çerezde, kendi yolunda. */
export const SATICI_SUTUNLARI: readonly SutunTanimi<SutunAnahtari>[] = SUTUNLAR.filter((s) => s.anahtar !== "satici");
export const SATICI_SUTUN_CEREZI = "doktorlarim-sutunlar";
export const SATICI_SUTUN_YOLU = "/my-doctors";

