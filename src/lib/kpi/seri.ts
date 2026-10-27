import type { Ay, Kova } from "@/lib/donem";

/**
 * Kayıtları kova aralıklarına (gün, hafta ya da ay) böler (yarı açık [başlangıç, bitiş)); hiçbir
 * kovaya düşmeyen kayıt atılır.
 */
export function kovalaraBol<T>(kayitlar: readonly T[], kovalar: readonly Kova[], tarih: (kayit: T) => Date): T[][] {
  const bolum: T[][] = kovalar.map(() => []);
  for (const kayit of kayitlar) {
    const t = tarih(kayit).getTime();
    const i = kovalar.findIndex((k) => t >= k.aralik.baslangic.getTime() && t < k.aralik.bitis.getTime());
    if (i >= 0) bolum[i].push(kayit);
  }
  return bolum;
}

/**
 * Eksik ay kuralı: sayım ve ciro için o ay kayıt yoksa gerçek değer sıfırdır ("sifir");
 * ölçüm (ör. ay sonu bakiyesi) yoksa boşluk bırakılır ("bosluk") — enterpolasyon yapılmaz.
 */
export type BosAy = "sifir" | "bosluk";

export function doldur<V>(aylar: readonly Ay[], bul: (ay: Ay) => V | undefined, sifir: V, bos: BosAy): (V | null)[] {
  return aylar.map((ay) => bul(ay) ?? (bos === "sifir" ? sifir : null));
}
