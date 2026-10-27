import { MASKE, hassasMi, normallestir } from "@/lib/denetim/maske";

/**
 * Alan bazlı değişiklik listesi (KARARLAR X-18 §(3)/(6)). İç içe nesne ve dizi yol olarak düzleşir
 * (`kalemler[0].miktar`). Liste ham değerden kurulur, sonra maskelenir: hassas alanın değiştiği
 * görünür, değeri görünmez. Ekleme ve silmede bütün alanlar gelir.
 */

export type Yaprak = string | number | boolean | null;
/** Alan yalnız bir tarafta varsa öbür değer yoktur (boş değerden ayrı tutulur). */
export type AlanFarki = { alan: string; eski?: Yaprak; yeni?: Yaprak };

/** Cari payload'ındaki elle tutulan değişen alanlar listesi farka girmez. */
const FARK_DISI = new Set(["degisenAlanlar"]);

type Duz = Map<string, { deger: Yaprak; hassas: boolean }>;

function duzlestir(veri: unknown, yol: string, hassas: boolean, hedef: Duz): void {
  if (Array.isArray(veri)) {
    if (veri.length === 0) hedef.set(yol, { deger: "[]", hassas });
    veri.forEach((deger, i) => duzlestir(deger, `${yol}[${i}]`, hassas, hedef));
    return;
  }
  if (veri !== null && typeof veri === "object") {
    const girdiler = Object.entries(veri).filter(([anahtar, deger]) => deger !== undefined && !(yol === "" && FARK_DISI.has(anahtar)));
    if (girdiler.length === 0) hedef.set(yol, { deger: "{}", hassas });
    for (const [anahtar, deger] of girdiler) {
      duzlestir(deger, yol === "" ? anahtar : `${yol}.${anahtar}`, hassas || hassasMi(anahtar), hedef);
    }
    return;
  }
  hedef.set(yol, { deger: veri as Yaprak, hassas });
}

function duz(veri: unknown): Duz {
  const hedef: Duz = new Map();
  if (veri !== undefined && veri !== null) duzlestir(normallestir(veri), "", false, hedef);
  return hedef;
}

export function alanFarklari(once: unknown, sonra: unknown): AlanFarki[] {
  const a = duz(once);
  const b = duz(sonra);
  const alanlar = [...a.keys(), ...[...b.keys()].filter((alan) => !a.has(alan))];
  return alanlar.flatMap((alan) => {
    const eski = a.get(alan);
    const yeni = b.get(alan);
    if (eski && yeni && eski.deger === yeni.deger) return [];
    const gizli = Boolean(eski?.hassas || yeni?.hassas);
    const goster = (d: Yaprak): Yaprak => (gizli && d !== null ? MASKE : d);
    return [{ alan, ...(eski ? { eski: goster(eski.deger) } : {}), ...(yeni ? { yeni: goster(yeni.deger) } : {}) }];
  });
}
