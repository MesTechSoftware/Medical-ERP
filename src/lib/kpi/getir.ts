import { randomUUID } from "node:crypto";

import { teknikHataLogSatiri } from "@/lib/hata";
import { simdi } from "@/lib/zaman";

export type KpiSonucu<T> = { tamam: true; deger: T } | { tamam: false; referans: string };

/**
 * Bir KPI'ın verisini getirir; sorgu hata verirse yalnız o kart düşer, sayfa çökmez. X-3 ile:
 * hata yutulmaz ve başarı dönmez — kart sabit metin ("Yüklenemedi") ve referans gösterir, aynı
 * referans container log'una teknik hata satırı olarak yazılır (X-3 §(2)/(4)/(6); mesaj ve
 * `meta` yazılmaz). Uygulamada teknik hatanın ekrana referansla düşürüldüğü tek kapsül budur.
 */
export async function kpiGetir<T>(
  getir: () => Promise<T>,
  baglam: { yol: string; kullaniciId: string | null }
): Promise<KpiSonucu<T>> {
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
