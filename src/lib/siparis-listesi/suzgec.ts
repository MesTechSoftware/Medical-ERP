import type { OrderStatus } from "@/generated/prisma/enums";
import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";
import { yerelGunMetni } from "@/lib/zaman";

/**
 * Sipariş listesinin süzgeci (spec Ü-23 §3.3); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * `durum` onaylı siparişin durumudur; `TEKLIF` aşamadır (A-5). Eski `status` adresi `durum` gibi
 * okunur (dashboard bağlantısı, yer imleri). Günler İstanbul günüdür; aralığa çevirme `sorgu.ts`'te.
 * Saf modül.
 */

export type SiparisDurumu = OrderStatus | "TEKLIF";

export type SiparisSuzgeci = {
  durum: SiparisDurumu | null;
  baslangic: string | null;
  bitis: string | null;
  /** Kullanıcı kimliği ya da `SATICISIZ` (bayi siparişi). */
  satici: string | null;
  q: string | null;
};

export const BOS_SUZGEC: SiparisSuzgeci = { durum: null, baslangic: null, bitis: null, satici: null, q: null };

export const SATICISIZ = "yok";

const METIN_SINIRI = 100;

/** Sekme sırası ve etiketleri (bugünkü sekmelerle aynı metin); KPI kartları da buradan okur. */
export const DURUMLAR: readonly { kod: SiparisDurumu; etiket: string }[] = [
  { kod: "BEKLIYOR", etiket: "Bekliyor" },
  { kod: "HAZIRLANIYOR", etiket: "Hazırlanıyor" },
  { kod: "KARGOLANDI", etiket: "Kargolandı" },
  { kod: "TESLIM_EDILDI", etiket: "Teslim Edildi" },
  { kod: "IPTAL", etiket: "İptal" },
  { kod: "TEKLIF", etiket: "Teklif" },
];
const DURUM_KODLARI = DURUMLAR.map((d) => d.kod);

export type { Parametreler };

/**
 * Listenin ekranı: yönetici `/orders` (bütün siparişler), satıcı `/my-orders` (yalnız kendi siparişleri,
 * X-13 — kapsam sorgudadır, `sorgu.ts`). Adres üreticileri bu yolu yazar; varsayılan yönetici ekranıdır.
 */
export type SiparisYolu = "/orders" | "/my-orders";

/**
 * Sorguların kapsamı (X-13): bütün siparişler (yönetici ekranları) ya da bir satıcının kendi siparişleri
 * (Siparişlerim). Zorunludur ve açıkça seçilir — unutulan ya da boş bir kimlik "herkes"e düşmesin.
 */
export type SiparisKapsami = { tur: "tum" } | { tur: "satici"; saticiId: string };
export const TUM_SIPARISLER: SiparisKapsami = { tur: "tum" };

/** Kapsamın sipariş koşulu; satıcı kapsamında `sellerId` eşitliği. */
export function kapsamKosulu(k: SiparisKapsami): { sellerId?: string } {
  return k.tur === "satici" ? { sellerId: k.saticiId } : {};
}

export function suzgecCoz(p: Parametreler): { suzgec: SiparisSuzgeci; detay: string | null } {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    suzgec: {
      durum: secenek(ilk(p, "durum") ?? ilk(p, "status"), DURUM_KODLARI),
      baslangic,
      bitis,
      satici: kimlik(ilk(p, "satici")),
      q: q === "" ? null : q,
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa, sayfa boyu ve panel isteğe bağlı. */
export function siparisAdresi(
  s: SiparisSuzgeci,
  ek: { page?: number; per?: number; detay?: string } = {},
  yol: SiparisYolu = "/orders"
): string {
  const p = new URLSearchParams();
  if (s.durum) p.set("durum", s.durum);
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.satici) p.set("satici", s.satici);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `${yol}?${q}` : yol;
}

/** Durum sekmeleri: yalnız `durum`'u yazar, öbür süzgeçleri korur; sayfa düşer. */
export function hizliSekmeler(s: SiparisSuzgeci, yol: SiparisYolu = "/orders"): readonly { etiket: string; adres: string; etkin: boolean }[] {
  return [{ kod: null, etiket: "Tümü" }, ...DURUMLAR].map((d) => ({
    etiket: d.etiket,
    adres: siparisAdresi({ ...s, durum: d.kod }, {}, yol),
    etkin: s.durum === d.kod,
  }));
}

/**
 * KPI kartlarının aralığı (spec §3.2): tarih süzgeci varsa o, yoksa bu ay (ayın 1'i – `bugun`).
 * Metin, satıcı ve durum süzgeci aralığı değiştirmez.
 */
export function kpiAraligi(s: SiparisSuzgeci, bugun: string): { baslangic: string | null; bitis: string | null; varsayilan: boolean } {
  if (s.baslangic || s.bitis) return { baslangic: s.baslangic, bitis: s.bitis, varsayilan: false };
  return { baslangic: `${bugun.slice(0, 8)}01`, bitis: bugun, varsayilan: true };
}

/** Durum kartının adresi: kartın saydığı aralığı yazar, satır sayısı kartla aynı olur (A-5-8). */
export function kartAdresi(durum: OrderStatus, a: { baslangic: string | null; bitis: string | null }, yol: SiparisYolu = "/orders"): string {
  return siparisAdresi({ ...BOS_SUZGEC, durum, baslangic: a.baslangic, bitis: a.bitis }, {}, yol);
}

/**
 * Dashboard "Sipariş durumları" diliminin adresi: dashboard aralığını (yarı açık, an) İstanbul günlerine
 * çevirir — bitiş dışlayıcı olduğundan son gün `bitis − 1 ms`'nin günüdür. Sayı listeyle aynıdır (A-5-8).
 */
export function dagilimAdresi(durum: OrderStatus, aralik: { baslangic: Date; bitis: Date }): string {
  const son = new Date(Math.max(aralik.baslangic.getTime(), aralik.bitis.getTime() - 1));
  return kartAdresi(durum, { baslangic: yerelGunMetni(aralik.baslangic), bitis: yerelGunMetni(son) });
}

type Anahtar = "durum" | "tarih" | "satici" | "q";

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle; adı bilinmeyen satıcı etiketlenmez. */
export function etkinSuzgecler(
  s: SiparisSuzgeci,
  saticiAdi: (id: string) => string | undefined,
  yol: SiparisYolu = "/orders"
): { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: Anahtar; etiket: string; kaldirAdresi: string }[] = [];
  const adres = (d: SiparisSuzgeci) => siparisAdresi(d, {}, yol);
  if (s.durum) {
    const etiket = DURUMLAR.find((d) => d.kod === s.durum)!.etiket;
    liste.push({ anahtar: "durum", etiket: `Durum: ${etiket}`, kaldirAdresi: adres({ ...s, durum: null }) });
  }
  if (s.baslangic || s.bitis) {
    liste.push({
      anahtar: "tarih",
      etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`,
      kaldirAdresi: adres({ ...s, baslangic: null, bitis: null }),
    });
  }
  const ad = s.satici === SATICISIZ ? "Satıcısız (bayi)" : s.satici ? saticiAdi(s.satici) : undefined;
  if (ad !== undefined) {
    liste.push({ anahtar: "satici", etiket: `Satıcı: ${ad}`, kaldirAdresi: adres({ ...s, satici: null }) });
  }
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: adres({ ...s, q: null }) });
  return liste;
}

/** Sonuç boşken gösterilecek açıklamanın türü. */
export function bosDurum(s: SiparisSuzgeci): "hic-kayit" | "suzgecli" {
  return s.durum || s.baslangic || s.bitis || s.satici || s.q ? "suzgecli" : "hic-kayit";
}
