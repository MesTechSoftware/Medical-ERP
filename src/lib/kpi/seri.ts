import type { Ay } from "@/lib/donem";

/** Kayıtları ay aralıklarına böler (yarı açık [başlangıç, bitiş)); hiçbir aya düşmeyen kayıt atılır. */
export function aylaraBol<T>(kayitlar: readonly T[], aylar: readonly Ay[], tarih: (kayit: T) => Date): T[][] {
  const kovalar: T[][] = aylar.map(() => []);
  for (const kayit of kayitlar) {
    const t = tarih(kayit).getTime();
    const i = aylar.findIndex((a) => t >= a.aralik.baslangic.getTime() && t < a.aralik.bitis.getTime());
    if (i >= 0) kovalar[i].push(kayit);
  }
  return kovalar;
}

/**
 * Eksik ay kuralı: sayım ve ciro için o ay kayıt yoksa gerçek değer sıfırdır ("sifir");
 * ölçüm (ör. ay sonu bakiyesi) yoksa boşluk bırakılır ("bosluk") — enterpolasyon yapılmaz.
 */
export type BosAy = "sifir" | "bosluk";

export function doldur<V>(aylar: readonly Ay[], bul: (ay: Ay) => V | undefined, sifir: V, bos: BosAy): (V | null)[] {
  return aylar.map((ay) => bul(ay) ?? (bos === "sifir" ? sifir : null));
}
