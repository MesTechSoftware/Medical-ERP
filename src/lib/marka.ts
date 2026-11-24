/**
 * Marka yapılandırması (KARARLAR E-2). Sunucu tarafı ortam değişkenleridir — `NEXT_PUBLIC_` değil:
 * o önek değeri derlemede paketlere gömer, marka imaj yeniden derlenmeden değişmez. Değerler yalnız
 * sunucu bileşenlerinde ve `generateMetadata`'da, istek anında (`connection()`) okunur.
 *
 * - `APP_BRAND`: görünen ad; boşsa nötr varsayılan.
 * - `APP_LOGO` / `APP_LOGO_MARK`: tam logo ve dar işaret için `public/` yolu ya da adres; boşsa
 *   markanın baş harfinden nötr işaret çizilir.
 */
export const VARSAYILAN_MARKA = "Medikal Satış Operasyon";

export function marka(): string {
  return process.env.APP_BRAND?.trim() || VARSAYILAN_MARKA;
}

export function logoYolu(tur: "tam" | "isaret"): string | null {
  const deger = (tur === "tam" ? process.env.APP_LOGO : process.env.APP_LOGO_MARK)?.trim();
  return deger || null;
}
