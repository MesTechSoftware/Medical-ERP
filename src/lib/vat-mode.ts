/**
 * KDV görünüm tercihi (FR-18): tutarlar "KDV Dahil" mi "KDV Hariç" mi gösterilsin.
 *
 * Tercih ÇEREZDE tutulur; böylece sunucu ilk render'da doğru modu bilir
 * (localStorage + useEffect hem hydration uyuşmazlığı hem zincirleme render üretirdi).
 *
 * ⚠️ Bu sabitler bilerek AYRI ve "use client" İÇERMEYEN bir modülde durur:
 * bir sunucu bileşeni, "use client" modülünden sabit import ederse Next.js onu
 * bir client referansına çevirir ve sunucu tarafında gerçek string değeri
 * göremez — `cookies().get(...)` sessizce undefined döner.
 */
export type VatMode = "NET" | "GROSS";

export const VAT_MODE_COOKIE = "vatMode";

/** Çerezden okunan ham değeri güvenli bir moda çevirir. */
export function parseVatMode(raw: string | undefined): VatMode {
  return raw === "GROSS" ? "GROSS" : "NET";
}
