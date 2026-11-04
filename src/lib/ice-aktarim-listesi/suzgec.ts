import type { ImportDataType } from "@/generated/prisma/enums";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim/adlar";
import { aralikEtiketi, gun, ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";

/**
 * İçe aktarım partilerinin süzgeci (spec Ü-30 §3.2); adres çubuğunda durur, geçersiz değer yok sayılır. Varsayılan
 * bütün partilerdir. "Geri alınabilir" yalnız kart süzgecidir (sekme değil). Günler `createdAt`'in İstanbul günüdür.
 * Saf modül.
 */

export type PartiDurumu = "tumu" | "yazildi" | "geri-alinabilir" | "geri-alindi";

export type PartiSuzgeci = {
  durum: PartiDurumu;
  tur: ImportDataType | null;
  baslangic: string | null;
  bitis: string | null;
  q: string | null;
};

export const BOS_SUZGEC: PartiSuzgeci = { durum: "tumu", tur: null, baslangic: null, bitis: null, q: null };

const TURLER = Object.keys(VERI_TIPI_ADI) as ImportDataType[];
const DURUM_ADI: Record<PartiDurumu, string> = { tumu: "Tümü", yazildi: "Yazıldı", "geri-alinabilir": "Geri alınabilir", "geri-alindi": "Geri alındı" };
const SEKMELER: readonly PartiDurumu[] = ["tumu", "yazildi", "geri-alindi"];
const METIN_SINIRI = 100;

export type { Parametreler };

export function suzgecCoz(p: Parametreler): { suzgec: PartiSuzgeci; detay: string | null } {
  let baslangic = gun(ilk(p, "baslangic"));
  let bitis = gun(ilk(p, "bitis"));
  if (baslangic !== null && bitis !== null && bitis < baslangic) [baslangic, bitis] = [bitis, baslangic];
  const q = (ilk(p, "q") ?? "").trim().slice(0, METIN_SINIRI);
  return {
    suzgec: {
      durum: secenek(ilk(p, "durum"), ["yazildi", "geri-alinabilir", "geri-alindi"] as const) ?? "tumu",
      tur: secenek(ilk(p, "tur"), TURLER),
      baslangic,
      bitis,
      q: q === "" ? null : q,
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa, sayfa boyu ve panel isteğe bağlı. */
export function partiAdresi(s: PartiSuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.durum !== "tumu") p.set("durum", s.durum);
  if (s.tur) p.set("tur", s.tur);
  if (s.baslangic) p.set("baslangic", s.baslangic);
  if (s.bitis) p.set("bitis", s.bitis);
  if (s.q) p.set("q", s.q);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/imports?${q}` : "/imports";
}

/** Durum sekmeleri: yalnız durumu yazar, öbür süzgeçleri korur; sayfa düşer. */
export function durumSekmeleri(s: PartiSuzgeci): { etiket: string; adres: string; etkin: boolean }[] {
  return SEKMELER.map((d) => ({ etiket: DURUM_ADI[d], adres: partiAdresi({ ...s, durum: d }), etkin: s.durum === d }));
}

/** KPI kartlarının adresleri (X-12-2): kart = açtığı süzgecin satırı. */
export function kartAdresleri(bugun: string): { tumu: string; buAy: string; geriAlinabilir: string; geriAlindi: string } {
  return {
    tumu: partiAdresi(BOS_SUZGEC),
    buAy: partiAdresi({ ...BOS_SUZGEC, baslangic: `${bugun.slice(0, 8)}01`, bitis: bugun }),
    geriAlinabilir: partiAdresi({ ...BOS_SUZGEC, durum: "geri-alinabilir" }),
    geriAlindi: partiAdresi({ ...BOS_SUZGEC, durum: "geri-alindi" }),
  };
}

export function etkinSuzgecler(s: PartiSuzgeci): { anahtar: string; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: string; etiket: string; kaldirAdresi: string }[] = [];
  if (s.durum !== "tumu") liste.push({ anahtar: "durum", etiket: `Durum: ${DURUM_ADI[s.durum]}`, kaldirAdresi: partiAdresi({ ...s, durum: "tumu" }) });
  if (s.tur) liste.push({ anahtar: "tur", etiket: `Tür: ${VERI_TIPI_ADI[s.tur]}`, kaldirAdresi: partiAdresi({ ...s, tur: null }) });
  if (s.baslangic || s.bitis) {
    liste.push({ anahtar: "tarih", etiket: `Tarih: ${aralikEtiketi(s.baslangic, s.bitis)}`, kaldirAdresi: partiAdresi({ ...s, baslangic: null, bitis: null }) });
  }
  if (s.q) liste.push({ anahtar: "q", etiket: `Ara: ${s.q}`, kaldirAdresi: partiAdresi({ ...s, q: null }) });
  return liste;
}

export function bosDurum(s: PartiSuzgeci): "hic-kayit" | "suzgecli" {
  return s.durum !== "tumu" || s.tur || s.baslangic || s.bitis || s.q ? "suzgecli" : "hic-kayit";
}
