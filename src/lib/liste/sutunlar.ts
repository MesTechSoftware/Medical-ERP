/**
 * Liste ekranlarının sütun seçici çerez biçimi (spec Ü-18 §3.4, Ü-19 §3.4). Çerez gizli sütun
 * anahtarlarını virgülle taşır; çerez yoksa tanımdaki varsayılan gizliler uygulanır, hiçbiri gizli
 * değilse `HICBIRI` yazılır. Saf modül.
 */

export type SutunTanimi<K extends string> = { anahtar: K; baslik: string; varsayilanGizli?: boolean };

/** Hiçbir sütun gizli değil — boş değer çerezin yokluğuyla karışmasın. */
export const HICBIRI = "-";

const gecerli = <K extends string>(sutunlar: readonly SutunTanimi<K>[], gizli: Iterable<string>): K[] => {
  const kume = new Set(gizli);
  return sutunlar.map((s) => s.anahtar).filter((a) => kume.has(a));
};

/** Bozuk ya da bilinmeyen anahtar yok sayılır. */
export function gizliSutunlariCoz<K extends string>(
  sutunlar: readonly SutunTanimi<K>[],
  deger: string | undefined
): ReadonlySet<K> {
  if (deger === undefined) return new Set(sutunlar.filter((s) => s.varsayilanGizli).map((s) => s.anahtar));
  return new Set(gecerli(sutunlar, deger.split(",")));
}

export function gizliSutunCerezi<K extends string>(sutunlar: readonly SutunTanimi<K>[], gizli: Iterable<string>): string {
  return gecerli(sutunlar, gizli).join(",") || HICBIRI;
}

/** Kaydettikten sonra dönülecek adres: yalnız `yol` listesi, başkası listeye düşer (açık yönlendirme yok). */
export function guvenliDonus(yol: string, donus: string): string {
  return donus === yol || donus.startsWith(`${yol}?`) ? donus : yol;
}
