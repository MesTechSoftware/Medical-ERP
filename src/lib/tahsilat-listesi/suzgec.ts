import { type Parametreler, aralikEtiketi, gun, ilk, kimlik, secenek } from "@/lib/liste/parametreler";

/**
 * Tahsilat ekranının süzgeci (spec Ü-26 §3.3); adres çubuğunda durur, geçersiz değer yok sayılır. Varsayılan
 * aktif tahsilatlardır. Günler `paidAt`'in İstanbul günüdür (aralığa çevirme `sorgu.ts`'te). Yöntem süzgeci
 * kodda kapalı tiptir (A-11: NAKIT/BANKA/POS). Saf modül.
 */

export type TahsilatDurumu = "aktif" | "IPTAL" | "tumu";
export type TahsilatTipi = "NAKIT" | "BANKA" | "POS";

export type TahsilatSuzgeci = {
  baslangic: string | null;
  bitis: string | null;
  durum: TahsilatDurumu;
  tip: TahsilatTipi | null;
  q: string | null;
};

export const BOS_SUZGEC: TahsilatSuzgeci = { baslangic: null, bitis: null, durum: "aktif", tip: null, q: null };

export const TIPLER: readonly TahsilatTipi[] = ["NAKIT", "BANKA", "POS"];
export const TIP_ADI: Record<TahsilatTipi, string> = { NAKIT: "Nakit", BANKA: "Banka", POS: "POS" };
export const DURUM_ADI: Record<TahsilatDurumu, string> = { aktif: "Aktif", IPTAL: "İptal edilen", tumu: "Tümü" };

const METIN_SINIRI = 100;

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: TahsilatSuzgeci; detay: string | null } {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    suzgec: {
      baslangic,
      bitis,
      durum: secenek(ilk(p, "durum"), ["IPTAL", "tumu"] as const) ?? "aktif",
      tip: secenek(ilk(p, "tip"), TIPLER),
      q: q === "" ? null : q,
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa, sayfa boyu ve panel isteğe bağlı. */
export function tahsilatAdresi(s: TahsilatSuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.durum !== "aktif") p.set("durum", s.durum);
  if (s.tip) p.set("tip", s.tip);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/collections?${q}` : "/collections";
}

type Tarih = Pick<TahsilatSuzgeci, "baslangic" | "bitis">;

export { tarihSekmeleri as hizliSekmeler, etkinTarihSekmesi as etkinSekme } from "@/lib/liste/tarih-sekmeleri";

/** Tarih sekmesinin adresi: tarihleri yazar, öbür süzgeçleri korur; sayfa düşer. */
export function sekmeAdresi(s: TahsilatSuzgeci, tarih: Tarih): string {
  return tahsilatAdresi({ ...s, ...tarih });
}

/**
 * KPI kartlarının aralığı (spec §3.2): tarih süzgeci varsa o, yoksa bu ay (ayın 1'i – `bugun`).
 * Durum, tip ve metin süzgeci aralığı değiştirmez.
 */
/** Kartın adresi: saydığı aralığı (varsayılanda da) ve tipi yazar; açtığı süzgecin toplamı kartla aynıdır (A-11-2). */
export function kartAdresi(tip: TahsilatTipi | null, a: Tarih): string {
  return tahsilatAdresi({ ...BOS_SUZGEC, baslangic: a.baslangic, bitis: a.bitis, tip });
}

/** Etkin süzgeç etiketleri, her biri o alanı düşüren adresle; varsayılan aktif etiketsiz. */
export function etkinSuzgecler(s: TahsilatSuzgeci): { anahtar: string; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: string; etiket: string; kaldirAdresi: string }[] = [];
  if (s.baslangic || s.bitis) {
    liste.push({ anahtar: "tarih", etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`, kaldirAdresi: tahsilatAdresi({ ...s, baslangic: null, bitis: null }) });
  }
  if (s.durum !== "aktif") liste.push({ anahtar: "durum", etiket: `Durum: ${DURUM_ADI[s.durum]}`, kaldirAdresi: tahsilatAdresi({ ...s, durum: "aktif" }) });
  if (s.tip) liste.push({ anahtar: "tip", etiket: `Yöntem: ${TIP_ADI[s.tip]}`, kaldirAdresi: tahsilatAdresi({ ...s, tip: null }) });
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: tahsilatAdresi({ ...s, q: null }) });
  return liste;
}

export function bosDurum(s: TahsilatSuzgeci): "hic-kayit" | "suzgecli" {
  return s.baslangic || s.bitis || s.durum !== "aktif" || s.tip || s.q ? "suzgecli" : "hic-kayit";
}
