import { randomUUID } from "node:crypto";

import { teknikHataLogSatiri } from "@/lib/hata";
import { simdi } from "@/lib/zaman";

export type KapsulSonucu<T> = { tamam: true; deger: T } | { tamam: false; referans: string };

/**
 * Bağımsız bir okuma ya da işlemi kapsüller: hata verirse yalnız o parça düşer, sayfa ya da toplu işlem
 * çökmez. X-3 ile: hata yutulmaz ve başarı dönmez — çağıran sabit metin ve referans gösterir, aynı
 * referans container log'una teknik hata satırı olarak yazılır (X-3 §(2)/(4)/(6); mesaj ve `meta`
 * yazılmaz). Uygulamada teknik hatanın ekrana referansla düşürüldüğü tek kapsül budur: KPI kartları
 * (`kpiGetir`), sayfa şeridi ve toplu kargonun sipariş başına adımı (`topluKargo`, Ü-24) kullanır.
 */
export async function hataKapsulu<T>(
  getir: () => Promise<T>,
  baglam: { yol: string; kullaniciId: string | null }
): Promise<KapsulSonucu<T>> {
  try {
    return { tamam: true, deger: await getir() };
  } catch (hata) {
    const referans = randomUUID().slice(0, 8);
    console.error(
      teknikHataLogSatiri({ zaman: simdi(), referans, yol: baglam.yol, kullaniciId: baglam.kullaniciId, hata })
    );
    return { tamam: false, referans };
  }
}
