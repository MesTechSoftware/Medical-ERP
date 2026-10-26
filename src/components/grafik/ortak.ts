/**
 * Mikro grafik ortakları (ADR-009; 2. tur). Grafikler etkileşimsizdir ve sunucuda saf SVG
 * olarak çizilir — istemciye JS gitmez, kütüphane yoktur. Geometri `lib/kpi/olcek.ts`'tedir.
 */

export type GrafikBoyutu = "XS" | "S" | "M";

/**
 * Görünür ölçü: XS tablo hücresine sığar (compact 20 px, dokunmatikte 28 px — satır 32 / 48 px),
 * S kart içi, M başlık. SVG `preserveAspectRatio="none"` ile kutuyu doldurur; çizgiler
 * `vector-effect` ile ölçekte incelmez.
 */
export const BOYUT_SINIFI: Record<GrafikBoyutu, string> = {
  XS: "h-5 w-16 dokunmatik:h-7",
  S: "h-8 w-full",
  M: "h-12 w-full",
};

/** viewBox ölçüsü (birim): genişlik sabit 100, yükseklik 24; çizgi kalınlığı için dikey pay. */
export const VIEWBOX = { genislik: 100, yukseklik: 24, pay: 3 } as const;
