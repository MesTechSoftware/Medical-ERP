import { policy } from "@/lib/policy";

/**
 * Gün ve yıl türeten okumaların TEK modülü (E-1 §(6)). `new Date()` doğrudan çağrılmaz.
 * İş kuralı taşımaz, dönüşüm yapar; tek çağrı noktası listesine girmez.
 *
 * "Gün" daima `zaman.saatDilimi` takvim günüdür (E-1 §(3)); sunucunun dilimi
 * belirleyici değildir. Aralıklar yarı açıktır: [baslangic, bitis) (E-1 §(4)).
 */

const DILIM = policy.zaman.saatDilimi;

/** `an`ın dilimdeki takvim günü: { yil, ay, gun }. */
function takvimGunu(an: Date): { yil: number; ay: number; gun: number } {
  const parcalar = new Intl.DateTimeFormat("en-CA", {
    timeZone: DILIM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(an);
  const al = (t: string) => parseInt(parcalar.find((p) => p.type === t)?.value ?? "", 10);
  return { yil: al("year"), ay: al("month"), gun: al("day") };
}

/** Dilimdeki yerel gece yarısının UTC anı. Ofset sabiti yazılmaz (E-1 §(2)). */
function geceYarisi(yil: number, ay: number, gun: number): Date {
  const utcTahmin = Date.UTC(yil, ay - 1, gun);
  const yerel = new Intl.DateTimeFormat("en-US", {
    timeZone: DILIM,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(utcTahmin));
  const al = (t: string) => parseInt(yerel.find((p) => p.type === t)?.value ?? "", 10);
  const yerelGibiUtc = Date.UTC(al("year"), al("month") - 1, al("day"), al("hour"), al("minute"));
  return new Date(utcTahmin - (yerelGibiUtc - utcTahmin));
}

/** Şu an. Kodda `new Date()` yerine bu çağrılır. */
export function simdi(): Date {
  return new Date();
}

/** Bugünün takvim günü — `date` kolonuna yazılacak biçimde (UTC gece yarısı). */
export function bugun(an: Date = simdi()): Date {
  const { yil, ay, gun } = takvimGunu(an);
  return new Date(Date.UTC(yil, ay - 1, gun));
}

/** `an`ın düştüğü dilim gününün yarı açık aralığı: [gün başı, ertesi gün başı). */
export function gunAraligi(an: Date): { baslangic: Date; bitis: Date } {
  const { yil, ay, gun } = takvimGunu(an);
  return { baslangic: geceYarisi(yil, ay, gun), bitis: geceYarisi(yil, ay, gun + 1) };
}

/** `an`ın dilimdeki takvim yılı (A-14 sayaç yılı). */
export function takvimYili(an: Date = simdi()): number {
  return takvimGunu(an).yil;
}

/** Takvim gününe gün ekler (`date` kolonları için; dilimden bağımsız). */
export function gunEkle(gun: Date, adet: number): Date {
  return new Date(Date.UTC(gun.getUTCFullYear(), gun.getUTCMonth(), gun.getUTCDate() + adet));
}

/** `an`ın dilimdeki takvim ayı (rapor ekranının varsayılan dönemi — X-1 §(2)). */
export function takvimAyi(an: Date = simdi()): { yil: number; ay: number } {
  const { yil, ay } = takvimGunu(an);
  return { yil, ay };
}

/** Dilimdeki takvim ayının yarı açık aralığı: [ay başı, sonraki ay başı). */
export function ayAraligi(yil: number, ay: number): { baslangic: Date; bitis: Date } {
  return { baslangic: geceYarisi(yil, ay, 1), bitis: geceYarisi(yil, ay + 1, 1) };
}

/** "Tüm zamanlar" — aralık parametresinin bilinçli seçimi (X-1 §(2)); varsayılan değildir. */
export const TUM_ZAMANLAR: Readonly<{ baslangic: Date; bitis: Date }> = Object.freeze({
  baslangic: new Date("1970-01-01T00:00:00Z"),
  bitis: new Date("9999-12-31T00:00:00Z"),
});
