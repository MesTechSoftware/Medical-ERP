import { ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Fiyat listesi ekranının süzgeci (spec Ü-21 §3.3); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * `aktif`: bugün geçerli en az bir satırı olan liste · `bos`: olmayan. Süzme `sorgu.ts`'tedir. Saf modül.
 */

export type ListeSuzgeci = { durum: "aktif" | "bos" | null };

export const BOS_SUZGEC: ListeSuzgeci = { durum: null };

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: ListeSuzgeci; detay: string | null } {
  return {
    suzgec: { durum: secenek(ilk(p, "durum"), ["aktif", "bos"] as const) },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa ve panel isteğe bağlı. */
export function listeAdresi(s: ListeSuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.durum) p.set("durum", s.durum);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/price-lists?${q}` : "/price-lists";
}

export const HIZLI_SEKMELER: readonly { etiket: "Tümü" | "Aktif" | "Boş"; suzgec: ListeSuzgeci }[] = [
  { etiket: "Tümü", suzgec: BOS_SUZGEC },
  { etiket: "Aktif", suzgec: { durum: "aktif" } },
  { etiket: "Boş", suzgec: { durum: "bos" } },
];

export function ayniSuzgec(a: ListeSuzgeci, b: ListeSuzgeci): boolean {
  return a.durum === b.durum;
}

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle. */
export function etkinSuzgecler(s: ListeSuzgeci): { anahtar: "durum"; etiket: string; kaldirAdresi: string }[] {
  if (!s.durum) return [];
  return [{ anahtar: "durum", etiket: `Durum: ${s.durum === "aktif" ? "Aktif" : "Boş"}`, kaldirAdresi: listeAdresi(BOS_SUZGEC) }];
}

/** Sonuç boşken gösterilecek açıklamanın türü (spec §3.4). */
export function bosDurum(s: ListeSuzgeci): "hic-kayit" | "suzgecli" {
  return s.durum === null ? "hic-kayit" : "suzgecli";
}
