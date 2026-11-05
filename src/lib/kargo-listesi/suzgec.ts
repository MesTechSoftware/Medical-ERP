import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Kargo ekranının süzgeçleri (spec Ü-24 §3.5) ve toplu kargo seçimi (§3.3). Sevkiyat listesinin süzgeci
 * adres çubuğundadır; geçersiz değer yok sayılır. Günler İstanbul günüdür (`shippedAt`); aralığa çevirme
 * `sorgu.ts`'tedir. `kismi` panelin siparişidir, süzgeç değildir. Saf modül.
 */

export type KargoSuzgeci = {
  baslangic: string | null;
  bitis: string | null;
  /** Firma kimliği ya da `FIRMASIZ`. */
  firma: string | null;
  durum: "KARGOLANDI" | "TESLIM_EDILDI" | null;
  q: string | null;
};

export const BOS_SUZGEC: KargoSuzgeci = { baslangic: null, bitis: null, firma: null, durum: null, q: null };
export const FIRMASIZ = "yok";
/** Toplu kargoda bir istekte en çok sipariş (tek eylemin süresi). */
export const TOPLU_SINIR = 50;

const METIN_SINIRI = 100;
const IRSALIYE_SINIRI = 32; // C-1: müşterinin irsaliye no'su (`VarChar(32)`)

export const DURUM_ETIKETI: Record<NonNullable<KargoSuzgeci["durum"]>, string> = {
  KARGOLANDI: "Kargolandı",
  TESLIM_EDILDI: "Teslim Edildi",
};

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: KargoSuzgeci; kismi: string | null } {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    suzgec: {
      baslangic,
      bitis,
      firma: kimlik(ilk(p, "firma")),
      durum: secenek(ilk(p, "durum"), ["KARGOLANDI", "TESLIM_EDILDI"] as const),
      q: q === "" ? null : q,
    },
    kismi: kimlik(ilk(p, "kismi")),
  };
}

/** Süzgeci koruyan ekran adresi; sayfa, sayfa boyu ve kısmi sevk paneli isteğe bağlı. */
export function kargoAdresi(s: KargoSuzgeci, ek: { page?: number; per?: number; kismi?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.firma) p.set("firma", s.firma);
  if (s.durum) p.set("durum", s.durum);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.kismi !== undefined) p.set("kismi", ek.kismi);
  const q = p.toString();
  return q ? `/shipping?${q}` : "/shipping";
}

type Tarih = Pick<KargoSuzgeci, "baslangic" | "bitis">;

/** Tarih kısayolları ortak modüldedir (`liste/tarih-sekmeleri.ts`). */
export { tarihSekmeleri as hizliSekmeler, etkinTarihSekmesi as etkinSekme } from "@/lib/liste/tarih-sekmeleri";

/** Sekmenin adresi: tarihleri yazar, öbür süzgeçleri korur; sayfa düşer. */
export function sekmeAdresi(s: KargoSuzgeci, tarih: Tarih): string {
  return kargoAdresi({ ...s, ...tarih });
}

type Anahtar = "tarih" | "firma" | "durum" | "q";

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle; adı bilinmeyen firma etiketlenmez. */
export function etkinSuzgecler(
  s: KargoSuzgeci,
  firmaAdi: (id: string) => string | undefined
): { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] = [];
  if (s.baslangic || s.bitis) {
    liste.push({ anahtar: "tarih", etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`, kaldirAdresi: kargoAdresi({ ...s, baslangic: null, bitis: null }) });
  }
  const ad = s.firma === FIRMASIZ ? "Firmasız" : s.firma ? firmaAdi(s.firma) : undefined;
  if (ad !== undefined) liste.push({ anahtar: "firma", etiket: `Firma: ${ad}`, kaldirAdresi: kargoAdresi({ ...s, firma: null }) });
  if (s.durum) liste.push({ anahtar: "durum", etiket: `Durum: ${DURUM_ETIKETI[s.durum]}`, kaldirAdresi: kargoAdresi({ ...s, durum: null }) });
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: kargoAdresi({ ...s, q: null }) });
  return liste;
}

export function bosDurum(s: KargoSuzgeci): "hic-kayit" | "suzgecli" {
  return s.baslangic || s.bitis || s.firma || s.durum || s.q ? "suzgecli" : "hic-kayit";
}

export type TopluSecim = { siparisId: string; takip: string | null; irsaliye: string | null };

const metin = (v: unknown, sinir?: number): string | null => {
  const t = typeof v === "string" ? v.trim().slice(0, sinir) : "";
  return t === "" ? null : t;
};

/**
 * Toplu kargo formunun seçimi (spec §3.3, A-3-3): `secili` kimlikleri (tekrar tek, bozuk düşer), satır başına
 * `takip_<id>` ve `irsaliye_<id>`. Seçim yoksa ya da `TOPLU_SINIR`'ı aşarsa hata.
 */
export function topluSecimCoz(f: { getAll(ad: string): unknown[]; get(ad: string): unknown }):
  | { secimler: TopluSecim[] }
  | { hata: "SECIM_YOK" | "SINIR_ASILDI" } {
  const idler = [
    ...new Set(f.getAll("secili").flatMap((v) => {
      const k = kimlik(typeof v === "string" ? v : null);
      return k ? [k] : [];
    })),
  ];
  if (idler.length === 0) return { hata: "SECIM_YOK" };
  if (idler.length > TOPLU_SINIR) return { hata: "SINIR_ASILDI" };
  return {
    secimler: idler.map((siparisId) => ({
      siparisId,
      takip: metin(f.get(`takip_${siparisId}`)),
      irsaliye: metin(f.get(`irsaliye_${siparisId}`), IRSALIYE_SINIRI),
    })),
  };
}

/**
 * "Tümünü seç": ilk `sinir` kutu seçili değilse onları seçer, gerisini bırakır (toplu işlem en çok `sinir`
 * sipariş alır); seçiliyse hepsini temizler. Girdi ve çıktı etkin kutuların sırasıdır.
 */
export function tumunuSecDurumu(secili: readonly boolean[], sinir: number = TOPLU_SINIR): boolean[] {
  const ilkler = secili.slice(0, sinir);
  if (ilkler.length > 0 && ilkler.every(Boolean)) return secili.map(() => false);
  return secili.map((_, i) => i < sinir);
}

/**
 * Kısmi sevkten sonra dönülecek adres: panelin açıldığı liste adresi (süzgeç, sayfa korunur; yalnız `/shipping`).
 * Sipariş hâlâ kargo bekliyorsa `kismi` paneli yeniden açar, tamamlandıysa düşer.
 */
export function kismiSonrasiAdres(donus: string, siparisId: string, tamamlandi: boolean): string {
  const url = new URL(donus === "/shipping" || donus.startsWith("/shipping?") ? donus : "/shipping", "http://x");
  if (tamamlandi) url.searchParams.delete("kismi");
  else url.searchParams.set("kismi", siparisId);
  return `${url.pathname}${url.search}`;
}
