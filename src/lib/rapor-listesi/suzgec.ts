import { donemAnahtari } from "@/lib/donem";
import { ilk, kimlik, type Parametreler } from "@/lib/liste/parametreler";

/**
 * Raporlar'ın doktor sıralaması süzgeci (spec Ü-27 §3.3); adres çubuğunda durur, geçersiz değer yok sayılır.
 * `donem` ham parametredir (çözümü `donemCoz`'da); satıcı süzgeci carinin bugünkü sahibidir. Saf modül.
 */

export type RaporSuzgeci = { donem: string | null; satici: string | null; q: string | null };

export const BOS_SUZGEC: RaporSuzgeci = { donem: null, satici: null, q: null };
export const SAHIPSIZ = "sahipsiz";

const METIN_SINIRI = 100;

export type { Parametreler };

/** Ekran: Raporlar `/reports` (şirket), Raporum `/my-report` (satıcının kendi cirosu, Ü-33 — satıcı süzgeci yok). */
export type RaporYolu = "/reports" | "/my-report";

export function suzgecCoz(p: Parametreler): RaporSuzgeci {
  const satici = ilk(p, "satici");
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    donem: donemAnahtari(ilk(p, "donem")),
    satici: satici === SAHIPSIZ ? SAHIPSIZ : kimlik(satici),
    q: q === "" ? null : q,
  };
}

/** Süzgeci ve dönemi koruyan adres; sayfa ve sayfa boyu isteğe bağlı. */
export function raporAdresi(s: RaporSuzgeci, ek: { page?: number; per?: number } = {}, yol: RaporYolu = "/reports"): string {
  const p = new URLSearchParams();
  if (s.donem) p.set("donem", s.donem);
  if (s.satici) p.set("satici", s.satici);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  const q = p.toString();
  return q ? `${yol}?${q}` : yol;
}

/** Dönem seçicinin gizli alanları: dönem değişince doktor süzgeci korunur. */
export function korunanlar(s: RaporSuzgeci): Record<string, string> {
  const k: Record<string, string> = {};
  if (s.satici) k.satici = s.satici;
  if (s.q) k.q = s.q;
  return k;
}

/** Satıcı Performansı'ndaki adın adresi: dönem korunur, metin düşer. */
export function saticiAdresi(s: RaporSuzgeci, saticiId: string): string {
  return raporAdresi({ donem: s.donem, satici: saticiId, q: null });
}

export function etkinSuzgecler(
  s: RaporSuzgeci,
  saticiAdi: (id: string) => string | undefined,
  yol: RaporYolu = "/reports"
): { anahtar: string; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: string; etiket: string; kaldirAdresi: string }[] = [];
  const ad = s.satici === SAHIPSIZ ? "Sahipsiz" : s.satici ? saticiAdi(s.satici) : undefined;
  if (ad !== undefined) {
    liste.push({ anahtar: "satici", etiket: s.satici === SAHIPSIZ ? ad : `Satıcı: ${ad}`, kaldirAdresi: raporAdresi({ ...s, satici: null }, {}, yol) });
  }
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: raporAdresi({ ...s, q: null }, {}, yol) });
  return liste;
}

export function bosDurum(s: RaporSuzgeci): "hic-kayit" | "suzgecli" {
  return s.satici || s.q ? "suzgecli" : "hic-kayit";
}
