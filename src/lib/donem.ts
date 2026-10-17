import { ayAraligi, simdi, takvimAyi, TUM_ZAMANLAR } from "@/lib/zaman";

export type Donem = { anahtar: string; aralik: { baslangic: Date; bitis: Date } };

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
