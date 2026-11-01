import { ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Ürün listesinin süzgeci (spec Ü-19 §3.2); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * `stok` hesaplanan değerdir (`stokDurumu`); süzme `sorgu.ts`'tedir. Saf modül.
 */

export type UrunSuzgeci = {
  durum: "AKTIF" | "PASIF" | null;
  /** `kritik`: eşik ve altı, tükendi dahil · `tukendi`: sıfır ve altı. */
  stok: "kritik" | "tukendi" | null;
};

export const BOS_SUZGEC: UrunSuzgeci = { durum: null, stok: null };

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: UrunSuzgeci; detay: string | null } {
  const detay = ilk(p, "detay");
  return {
    suzgec: {
      durum: secenek(ilk(p, "durum"), ["AKTIF", "PASIF"] as const),
      stok: secenek(ilk(p, "stok"), ["kritik", "tukendi"] as const),
    },
    detay: kimlik(detay),
  };
}

/** Süzgeci koruyan liste adresi; sayfa ve panel isteğe bağlı. */
export function urunAdresi(s: UrunSuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.durum) p.set("durum", s.durum);
  if (s.stok) p.set("stok", s.stok);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/products?${q}` : "/products";
}

export const HIZLI_SEKMELER: readonly { etiket: string; suzgec: UrunSuzgeci }[] = [
  { etiket: "Tümü", suzgec: BOS_SUZGEC },
  { etiket: "Aktif", suzgec: { ...BOS_SUZGEC, durum: "AKTIF" } },
  { etiket: "Pasif", suzgec: { ...BOS_SUZGEC, durum: "PASIF" } },
  { etiket: "Kritik stok", suzgec: { ...BOS_SUZGEC, stok: "kritik" } },
  { etiket: "Tükendi", suzgec: { ...BOS_SUZGEC, stok: "tukendi" } },
];

export function ayniSuzgec(a: UrunSuzgeci, b: UrunSuzgeci): boolean {
  return a.durum === b.durum && a.stok === b.stok;
}

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle. */
export function etkinSuzgecler(s: UrunSuzgeci): { anahtar: "durum" | "stok"; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: "durum" | "stok"; etiket: string; kaldirAdresi: string }[] = [];
  if (s.durum) {
    liste.push({ anahtar: "durum", etiket: `Durum: ${s.durum === "AKTIF" ? "Aktif" : "Pasif"}`, kaldirAdresi: urunAdresi({ ...s, durum: null }) });
  }
  if (s.stok) {
    liste.push({ anahtar: "stok", etiket: `Stok: ${s.stok === "kritik" ? "Kritik" : "Tükendi"}`, kaldirAdresi: urunAdresi({ ...s, stok: null }) });
  }
  return liste;
}

export type BosDurum = "hic-kayit" | "kritik" | "tukendi" | "suzgecli";

/** Sonuç boşken gösterilecek açıklamanın türü (spec §3.5). */
export function bosDurum(s: UrunSuzgeci): BosDurum {
  if (s.durum === null && s.stok === null) return "hic-kayit";
  if (s.durum === null && s.stok !== null) return s.stok;
  return "suzgecli";
}
