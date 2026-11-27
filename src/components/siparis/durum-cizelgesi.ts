/** Sipariş durum çizelgesinin saf eşlemesi (spec §5): hangi adım etkin, hangi not görünür. */
export const ADIMLAR = ["Sipariş Alındı", "Hazırlanıyor", "Kargolandı", "Teslim Edildi"] as const;

export type CizelgeGirdisi = { status: string; sevkVar: boolean; kalanKapatildi: boolean };
export type Cizelge =
  | { tur: "teklif" }
  | { tur: "iptal" }
  | { tur: "adimlar"; etkin: 0 | 1 | 2 | 3; not: string | null };

export function cizelgeEsle({ status, sevkVar, kalanKapatildi }: CizelgeGirdisi): Cizelge {
  switch (status) {
    case "TEKLIF":
      return { tur: "teklif" };
    case "IPTAL":
      return { tur: "iptal" };
    case "HAZIRLANIYOR":
      return { tur: "adimlar", etkin: 1, not: sevkVar ? "Kısmi sevk" : null };
    case "KARGOLANDI":
      return { tur: "adimlar", etkin: 2, not: kalanKapatildi ? "Kalanı kapatıldı" : null };
    case "TESLIM_EDILDI":
      return { tur: "adimlar", etkin: 3, not: null };
    default:
      return { tur: "adimlar", etkin: 0, not: null };
  }
}
