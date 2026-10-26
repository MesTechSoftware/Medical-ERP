import { ayAraligi, simdi, takvimAyi, TUM_ZAMANLAR } from "@/lib/zaman";

export type Aralik = { baslangic: Date; bitis: Date };

export type Donem = { anahtar: string; aralik: Aralik };

/** Bir takvim ayı: yarı açık aralığı ve `an`ın o ayın içinde olup olmadığı (devam eden ay). */
export type Ay = { yil: number; ay: number; aralik: Aralik; devamEdiyor: boolean };

/**
 * Rapor ekranının `?donem=` parametresi (X-1 §(2)): `YYYY-AA` bir takvim ayıdır, `tum`
 * tüm zamanlardır. Parametre yoksa ya da geçersizse içinde bulunulan ay.
 */
export function donemCoz(param: string | undefined, an: Date = simdi()): Donem {
  if (param === "tum") return { anahtar: "tum", aralik: TUM_ZAMANLAR };
  const m = param?.match(/^(\d{4})-(\d{2})$/);
  const ay = m ? parseInt(m[2], 10) : 0;
  if (m && ay >= 1 && ay <= 12) return { anahtar: param!, aralik: ayAraligi(parseInt(m[1], 10), ay) };
  const simdiki = takvimAyi(an);
  const anahtar = `${simdiki.yil}-${String(simdiki.ay).padStart(2, "0")}`;
  return { anahtar, aralik: ayAraligi(simdiki.yil, simdiki.ay) };
}

function oncekiAy(yil: number, ay: number): { yil: number; ay: number } {
  return ay === 1 ? { yil: yil - 1, ay: 12 } : { yil, ay: ay - 1 };
}

/** `bitis` ayıyla biten son `n` takvim ayı, eskiden yeniye (KPI ve mikro grafik serileri). */
export function sonAylar(n: number, bitis: { yil: number; ay: number }, an: Date = simdi()): Ay[] {
  const aylar: Ay[] = [];
  let yer = bitis;
  for (let i = 0; i < n; i++) {
    const aralik = ayAraligi(yer.yil, yer.ay);
    const devamEdiyor = an.getTime() >= aralik.baslangic.getTime() && an.getTime() < aralik.bitis.getTime();
    aylar.unshift({ yil: yer.yil, ay: yer.ay, aralik, devamEdiyor });
    yer = oncekiAy(yer.yil, yer.ay);
  }
  return aylar;
}

/**
 * KPI karşılaştırma aralıkları (K-1, aynı gün aralığı). Devam eden ayda: ay başından `an`a kadar,
 * önceki ayın aynı uzunluktaki başı ile kıyaslanır (önceki ay kısaysa ay sonuna kırpılır).
 * Geçmiş ya da gelecek ay: tam ay, önceki tam ayla. "Tüm zamanlar"ın karşılaştırması yoktur.
 */
export function karsilastirmaAraliklari(
  donem: Donem,
  an: Date = simdi()
): { simdi: Aralik; onceki: Aralik | null; devamEdiyor: boolean } {
  if (donem.anahtar === "tum") return { simdi: donem.aralik, onceki: null, devamEdiyor: false };
  const [yil, ay] = donem.anahtar.split("-").map((x) => parseInt(x, 10));
  const o = oncekiAy(yil, ay);
  const onceki = ayAraligi(o.yil, o.ay);
  const { baslangic, bitis } = donem.aralik;
  if (an.getTime() >= baslangic.getTime() && an.getTime() < bitis.getTime()) {
    const gecen = an.getTime() - baslangic.getTime();
    const oncekiBitis = new Date(Math.min(onceki.baslangic.getTime() + gecen, onceki.bitis.getTime()));
    return { simdi: { baslangic, bitis: an }, onceki: { baslangic: onceki.baslangic, bitis: oncekiBitis }, devamEdiyor: true };
  }
  return { simdi: donem.aralik, onceki, devamEdiyor: false };
}

/** KPI karşılaştırma notu (K-1): devam eden ay geçen ayın aynı günleriyle, geçmiş ay önceki tam ayla. */
export function karsilastirmaNotu(devamEdiyor: boolean): string {
  return devamEdiyor ? "geçen ayın aynı günlerine göre" : "önceki aya göre";
}

/** Dönemin son takvim ayı (KPI trendi bu ayla biter); "tüm zamanlar"da içinde bulunulan ay. */
export function donemBitisAyi(donem: Donem, an: Date = simdi()): { yil: number; ay: number } {
  if (donem.anahtar === "tum") return takvimAyi(an);
  const [yil, ay] = donem.anahtar.split("-").map((x) => parseInt(x, 10));
  return { yil, ay };
}
