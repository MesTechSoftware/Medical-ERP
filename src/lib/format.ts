import type { Kova, KovaTuru } from "@/lib/donem";
import { policy } from "@/lib/policy";

// Gösterim daima `zaman.saatDilimi`'ne sabittir; sunucunun ve tarayıcının dilimi
// okunmaz (E-1 §(2)/(7)).
const timeZone = policy.zaman.saatDilimi;

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * `date` kolonu (takvim günü) gösterimi. Değer UTC gece yarısıdır ve dilim
 * taşımaz (E-1 §(1)); İstanbul'a çevrilmez, olduğu gibi okunur.
 */
export function formatGun(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

const SAYI = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** Adet gösterimi, tr-TR binlik ayırıcıyla ("1.250"). Para değildir — tutar `<Tutar>` ile. */
export function formatSayi(n: number): string {
  return SAYI.format(n);
}

/** Takvim ayının kısa adı ("Eki"). Ayın kendisidir, an değildir: dilim dönüşümü yoktur. */
export function ayEtiketi(yil: number, ay: number): string {
  return new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(yil, ay - 1, 15)));
}

const GUN_AY = new Intl.DateTimeFormat("tr-TR", { timeZone, day: "numeric", month: "short" });
const GUN_NO = new Intl.DateTimeFormat("tr-TR", { timeZone, day: "numeric" });
const AY_ADI = new Intl.DateTimeFormat("tr-TR", { timeZone, month: "short" });

/**
 * Mikro grafik kovasının kısa adı (ekran okuyucu özeti), dilimdeki günlerle: gün "27 Eki", hafta
 * (Pazartesi–Pazar) "19–25 Eki" ya da ay geçişinde "26 Eki – 1 Kas", ay "Eki".
 */
export function kovaEtiketi(kova: Kova, tur: KovaTuru): string {
  const bas = kova.aralik.baslangic;
  if (tur === "gun") return GUN_AY.format(bas);
  if (tur === "ay") return AY_ADI.format(bas);
  const son = new Date(kova.aralik.bitis.getTime() - 1);
  return AY_ADI.format(bas) === AY_ADI.format(son)
    ? `${GUN_NO.format(bas)}–${GUN_AY.format(son)}`
    : `${GUN_AY.format(bas)} – ${GUN_AY.format(son)}`;
}

/**
 * Göreli zaman (aktivite akışı): "az önce", "12 dk önce", "3 sa önce", "2 gün önce"; bir haftadan
 * eskisi tarih. Tam an `title`'da `formatDateTime` ile verilir. Gelecekteki an (saat kayması) "az önce".
 */
export function goreliZaman(an: Date, simdi: Date): string {
  const dakika = Math.floor((simdi.getTime() - an.getTime()) / 60_000);
  if (dakika < 1) return "az önce";
  if (dakika < 60) return `${dakika} dk önce`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} sa önce`;
  const gun = Math.floor(saat / 24);
  return gun < 7 ? `${gun} gün önce` : formatDate(an);
}
