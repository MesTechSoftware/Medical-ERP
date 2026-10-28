/**
 * Cari listesinin gizlenebilir sütunları ve tercih çerezinin biçimi (spec Ü-18 §3.4). Ad Soyad ve
 * seçim kutusu burada yoktur — gizlenemez. Saf modül.
 */

export type SutunAnahtari = "klinik" | "telefon" | "satici" | "siparis" | "sonSiparis" | "bakiye" | "durum";

/** Tablo sırası. */
export const SUTUNLAR: readonly { anahtar: SutunAnahtari; baslik: string }[] = [
  { anahtar: "klinik", baslik: "Klinik / Bölge" },
  { anahtar: "telefon", baslik: "Telefon" },
  { anahtar: "satici", baslik: "Sorumlu Satıcı" },
  { anahtar: "siparis", baslik: "Sipariş" },
  { anahtar: "sonSiparis", baslik: "Son Sipariş" },
  { anahtar: "bakiye", baslik: "Bakiye" },
  { anahtar: "durum", baslik: "Durum" },
];

export const SUTUN_CEREZI = "doktor-sutunlar";

const gecerli = (gizli: Iterable<string>): SutunAnahtari[] => {
  const kume = new Set(gizli);
  return SUTUNLAR.map((s) => s.anahtar).filter((a) => kume.has(a));
};

/** Bozuk ya da bilinmeyen değer yok sayılır: varsayılan, bütün sütunlar görünür. */
export function gizliSutunlariCoz(deger: string | undefined): ReadonlySet<SutunAnahtari> {
  return new Set(gecerli((deger ?? "").split(",")));
}

export function gizliSutunCerezi(gizli: Iterable<string>): string {
  return gecerli(gizli).join(",");
}

/** Kaydettikten sonra dönülecek adres: yalnız cari listesi, başkası listeye düşer (açık yönlendirme yok). */
export function guvenliDonus(donus: string): string {
  return /^\/doctors(\?|$)/.test(donus) ? donus : "/doctors";
}
