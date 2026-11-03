import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";
import { BLOK_KURAL_ADI } from "@/lib/sozluk";

/**
 * Onay ekranının süzgeci (spec Ü-25 §3.3); adres çubuğunda durur, geçersiz değer yok sayılır. Varsayılan
 * bekleyen taleplerdir. Tarih olay günüdür (kararlıda karar, açıkta açılış; aralığa çevirme `sorgu.ts`'te).
 * `eski` açık ve 24 saatten eski talepleri seçer, `durum`'u ezer (adres tek anlam taşısın). Saf modül.
 */

export type OnayDurumu = "bekleyen" | "ONAY" | "RED" | "tumu";
export type OnayKurali = "NEGATIF_STOK" | "BEDELSIZ_ONAYI";

export type OnaySuzgeci = {
  durum: OnayDurumu;
  baslangic: string | null;
  bitis: string | null;
  eski: boolean;
  kural: OnayKurali | null;
  acan: string | null;
  q: string | null;
};

export const BOS_SUZGEC: OnaySuzgeci = { durum: "bekleyen", baslangic: null, bitis: null, eski: false, kural: null, acan: null, q: null };

const METIN_SINIRI = 100;

/** "Eski onay" sınırı, saat (D-1 brief): dashboard istisnası, KPI ve `eski` süzgeci bu sabitle sayar. */
export const ESKI_ONAY_SAATI = 24;

const SEKMELER: readonly { durum: OnayDurumu; etiket: "Bekleyen" | "Onaylanan" | "Reddedilen" | "Tümü" }[] = [
  { durum: "bekleyen", etiket: "Bekleyen" },
  { durum: "ONAY", etiket: "Onaylanan" },
  { durum: "RED", etiket: "Reddedilen" },
  { durum: "tumu", etiket: "Tümü" },
];

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: OnaySuzgeci; detay: string | null } {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  const eski = ilk(p, "eski") === "1";
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    suzgec: {
      durum: eski ? "bekleyen" : (secenek(ilk(p, "durum"), ["ONAY", "RED", "tumu"] as const) ?? "bekleyen"),
      baslangic,
      bitis,
      eski,
      kural: secenek(ilk(p, "kural"), ["NEGATIF_STOK", "BEDELSIZ_ONAYI"] as const),
      acan: kimlik(ilk(p, "acan")),
      q: q === "" ? null : q,
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa, sayfa boyu ve panel isteğe bağlı. */
export function onayAdresi(s: OnaySuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.durum !== "bekleyen") p.set("durum", s.durum);
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.eski) p.set("eski", "1");
  if (s.kural) p.set("kural", s.kural);
  if (s.acan) p.set("acan", s.acan);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/approvals?${q}` : "/approvals";
}

/** Durum sekmeleri: yalnız durumu yazar, `eski`'yi düşürür, öbür süzgeçleri korur; sayfa düşer. */
export function durumSekmeleri(s: OnaySuzgeci): readonly { etiket: (typeof SEKMELER)[number]["etiket"]; adres: string; etkin: boolean }[] {
  return SEKMELER.map((t) => ({ etiket: t.etiket, adres: onayAdresi({ ...s, durum: t.durum, eski: false }), etkin: s.durum === t.durum }));
}

/** KPI kartlarının adresleri (A-8-11): kart = açtığı süzgecin satırı. */
export function kartAdresleri(bugun: string): { eski: string; bugunOnay: string; bugunRed: string } {
  const bugunku = (durum: "ONAY" | "RED") => onayAdresi({ ...BOS_SUZGEC, durum, baslangic: bugun, bitis: bugun });
  return { eski: onayAdresi({ ...BOS_SUZGEC, eski: true }), bugunOnay: bugunku("ONAY"), bugunRed: bugunku("RED") };
}

/** Etkin süzgeç etiketleri, her biri o alanı düşüren adresle; varsayılan bekleyen ve adı bilinmeyen açan etiketsiz. */
export function etkinSuzgecler(
  s: OnaySuzgeci,
  acanAdi: (id: string) => string | undefined
): { anahtar: string; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: string; etiket: string; kaldirAdresi: string }[] = [];
  if (s.durum !== "bekleyen") {
    const etiket = SEKMELER.find((t) => t.durum === s.durum)!.etiket;
    liste.push({ anahtar: "durum", etiket: `Durum: ${etiket}`, kaldirAdresi: onayAdresi({ ...s, durum: "bekleyen" }) });
  }
  if (s.baslangic || s.bitis) {
    liste.push({ anahtar: "tarih", etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`, kaldirAdresi: onayAdresi({ ...s, baslangic: null, bitis: null }) });
  }
  if (s.eski) liste.push({ anahtar: "eski", etiket: "24 saatten eski", kaldirAdresi: onayAdresi({ ...s, eski: false }) });
  if (s.kural) liste.push({ anahtar: "kural", etiket: `Kural: ${BLOK_KURAL_ADI[s.kural]}`, kaldirAdresi: onayAdresi({ ...s, kural: null }) });
  const ad = s.acan ? acanAdi(s.acan) : undefined;
  if (ad !== undefined) liste.push({ anahtar: "acan", etiket: `Açan: ${ad}`, kaldirAdresi: onayAdresi({ ...s, acan: null }) });
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: onayAdresi({ ...s, q: null }) });
  return liste;
}

export function bosDurum(s: OnaySuzgeci): "hic-kayit" | "suzgecli" {
  return s.durum !== "bekleyen" || s.baslangic || s.bitis || s.eski || s.kural || s.acan || s.q ? "suzgecli" : "hic-kayit";
}
