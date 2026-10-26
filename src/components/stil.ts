/**
 * Ortak kontrol ve buton sınıfları (ADR-009). Direktifsiz modüldür: hem sunucu sayfaları hem
 * istemci bileşenleri kullanır — `"use client"` modülünden dışa aktarılan bir sabit sunucuda
 * istemci referansına dönüşürdü.
 */

/**
 * Input/select/textarea kutusu. Yükseklik ve genişlik içermez (çağıran ekler; iki genişlik
 * sınıfı yan yana yazılırsa hangisinin kazanacağı belirsizdir). Dokunmatikte yazı 16 px —
 * iOS Safari daha küçük yazılı alana odaklanınca sayfayı yakınlaştırır.
 */
export const KONTROL =
  "rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 aria-invalid:border-negative aria-invalid:focus:border-negative aria-invalid:focus:ring-negative dokunmatik:text-base";

/** Tek satırlı input ve select: kontrol yüksekliği (compact 32 px, dokunmatikte 44 px). */
export const KONTROL_TEK_SATIR = `${KONTROL} h-(--control-h)`;

/** Textarea ve çoklu seçim: sabit yükseklik yok, en az kontrol yüksekliği; içerik büyüdükçe uzar. */
export const KONTROL_COK_SATIR = `${KONTROL} min-h-(--control-h) py-2`;

export type ButonTuru =
  | "birincil"
  | "ikincil"
  | "olumlu"
  | "uyari"
  | "olumsuz"
  | "olumsuz-cerceve"
  | "metin"
  | "metin-olumsuz";

const TURLER: Record<ButonTuru, string> = {
  birincil: "bg-slate-900 text-white hover:bg-slate-800",
  ikincil: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  olumlu: "bg-positive text-white hover:bg-positive/90",
  uyari: "bg-critical text-white hover:bg-critical/90",
  olumsuz: "bg-negative text-white hover:bg-negative/90",
  "olumsuz-cerceve": "border border-negative/40 bg-white text-negative hover:bg-negative-bg",
  metin: "text-slate-600 hover:text-slate-900",
  "metin-olumsuz": "text-negative hover:underline",
};

/**
 * Buton (ya da buton görünümlü bağlantı) sınıfı. Yükseklik kontrol yüksekliğidir; metin
 * türleri satır içinde durur, dokunmatikte yine 44 px dokunma alanı alır. `form: true`
 * birincil form butonunu telefonda tam genişlik yapar.
 */
export function buton(tur: ButonTuru = "birincil", { form = false }: { form?: boolean } = {}): string {
  const metin = tur === "metin" || tur === "metin-olumsuz";
  const kutu = metin
    ? "inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium transition dokunmatik:min-h-11 dokunmatik:min-w-11 dokunmatik:justify-center"
    : "inline-flex h-(--control-h) items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition disabled:opacity-60";
  return `${kutu} ${TURLER[tur]}${form ? " w-full md:w-auto" : ""}`;
}
