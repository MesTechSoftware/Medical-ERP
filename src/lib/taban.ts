/**
 * Taban etiketi — Ü-3 §(6)/(7), §0.4. Ekrandaki her para tutarının yanında vergi tabanı yazılıdır.
 * Etiket serbest metin değildir; tabanı ekranın sınıfı ya da satır hesabının alanı belirler:
 *
 * - **A · matrah girilen** (fiyat listesi, sipariş satırı): `hesaplaSatirTutarlari()` alanından —
 *   `matrah` ve birim fiyat `KDV_HARIC`, `toplam` `KDV_DAHIL`, `kdvTutar` `KDV`.
 * - **B · brüt zorunlu** (cari bakiye, ekstre, tahsilat, risk): daima `KDV_DAHIL` (Ü-3 §(4)).
 * - **C · matrah zorunlu** (ciro, prim/hakediş): daima `KDV_HARIC` (Ü-3 §(5)).
 *
 * Çeviri (KDV dahil giriş) yoktur: `pricing.fiyatGirisiKdvDahil = false`, Faz 1'de açılmaz (Ü-3 §(3)).
 */

export type Taban = "KDV_HARIC" | "KDV_DAHIL" | "KDV";

export const TABAN_ETIKETI: Record<Taban, string> = {
  KDV_HARIC: "KDV hariç",
  KDV_DAHIL: "KDV dahil",
  KDV: "KDV tutarı",
};

/** B sınıfı ekranların tabanı: cari bakiye, tahsilat, risk — brüt. */
export const BRUT: Taban = "KDV_DAHIL";

/** C sınıfı ekranların ve A sınıfı matrah alanlarının tabanı. */
export const MATRAH: Taban = "KDV_HARIC";

/** A sınıfı: `hesaplaSatirTutarlari()` çıktısının alanları → taban. */
export const SATIR_TABANI = { matrah: "KDV_HARIC", kdvTutar: "KDV", toplam: "KDV_DAHIL" } as const satisfies Record<
  string,
  Taban
>;

/** Tablo/kart başlığı tabanıyla: "Ciro (KDV hariç)". Kolonun bütün hücreleri bu tabandadır (Ü-3 §(7)). */
export function tabanli(baslik: string, taban: Taban): string {
  return `${baslik} (${TABAN_ETIKETI[taban]})`;
}
