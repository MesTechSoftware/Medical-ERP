import type { Role } from "@/generated/prisma/enums";
import { ilk, kimlik, secenek, type Parametreler } from "@/lib/liste/parametreler";
import { ROLE_LABEL } from "@/lib/roles";

/**
 * Kullanıcı listesinin süzgeci (spec Ü-22 §3.3); adres çubuğunda durur. Geçersiz değer yok sayılır.
 * OPERASYON yalnız satıcıları görür (D-2): onun için `rol` yalnız `SATICI` olabilir. `portfoy=yok`
 * kendisi "aktif satıcı" demektir; `durum` ve `rol`'ü ezer (adres tek anlam taşısın). Saf modül.
 */

export type GorenRol = "YONETICI" | "OPERASYON";

export type KullaniciSuzgeci = {
  durum: "aktif" | "pasif" | null;
  rol: Role | null;
  portfoy: "yok" | null;
  parola: "gecici" | null;
};

export const BOS_SUZGEC: KullaniciSuzgeci = { durum: null, rol: null, portfoy: null, parola: null };

export type { Parametreler };

const ROLLER: Record<GorenRol, readonly Role[]> = {
  YONETICI: ["YONETICI", "OPERASYON", "SATICI"],
  OPERASYON: ["SATICI"],
};

export function suzgecCoz(p: Parametreler, gorenRol: GorenRol): { suzgec: KullaniciSuzgeci; detay: string | null } {
  const portfoy = secenek(ilk(p, "portfoy"), ["yok"] as const);
  return {
    suzgec: {
      durum: portfoy ? null : secenek(ilk(p, "durum"), ["aktif", "pasif"] as const),
      rol: portfoy ? null : secenek(ilk(p, "rol"), ROLLER[gorenRol]),
      portfoy,
      parola: secenek(ilk(p, "parola"), ["gecici"] as const),
    },
    detay: kimlik(ilk(p, "detay")),
  };
}

/** Süzgeci koruyan liste adresi; sayfa ve panel isteğe bağlı. */
export function kullaniciAdresi(s: KullaniciSuzgeci, ek: { page?: number; per?: number; detay?: string } = {}): string {
  const p = new URLSearchParams();
  if (s.durum) p.set("durum", s.durum);
  if (s.rol) p.set("rol", s.rol);
  if (s.portfoy) p.set("portfoy", s.portfoy);
  if (s.parola) p.set("parola", s.parola);
  if (ek.page !== undefined && ek.page > 1) p.set("page", String(ek.page));
  if (ek.per !== undefined) p.set("per", String(ek.per));
  if (ek.detay !== undefined) p.set("detay", ek.detay);
  const q = p.toString();
  return q ? `/users?${q}` : "/users";
}

/** Hızlı sekmeler; "Satıcılar" OPERASYON'da yoktur (zaten yalnız satıcıları görür). */
export function hizliSekmeler(gorenRol: GorenRol): readonly { etiket: string; suzgec: KullaniciSuzgeci }[] {
  return [
    { etiket: "Tümü", suzgec: BOS_SUZGEC },
    { etiket: "Aktif", suzgec: { ...BOS_SUZGEC, durum: "aktif" } },
    { etiket: "Pasif", suzgec: { ...BOS_SUZGEC, durum: "pasif" } },
    ...(gorenRol === "YONETICI" ? [{ etiket: "Satıcılar", suzgec: { ...BOS_SUZGEC, rol: "SATICI" as const } }] : []),
    { etiket: "Portföysüz", suzgec: { ...BOS_SUZGEC, portfoy: "yok" as const } },
  ];
}

export function ayniSuzgec(a: KullaniciSuzgeci, b: KullaniciSuzgeci): boolean {
  return a.durum === b.durum && a.rol === b.rol && a.portfoy === b.portfoy && a.parola === b.parola;
}

/** Etkin süzgeçlerin etiketleri, her biri o alanı düşüren adresle. */
export function etkinSuzgecler(s: KullaniciSuzgeci): { anahtar: keyof KullaniciSuzgeci; etiket: string; kaldirAdresi: string }[] {
  const liste: { anahtar: keyof KullaniciSuzgeci; etiket: string; kaldirAdresi: string }[] = [];
  if (s.durum) liste.push({ anahtar: "durum", etiket: `Durum: ${s.durum === "aktif" ? "Aktif" : "Pasif"}`, kaldirAdresi: kullaniciAdresi({ ...s, durum: null }) });
  if (s.rol) liste.push({ anahtar: "rol", etiket: `Rol: ${ROLE_LABEL[s.rol]}`, kaldirAdresi: kullaniciAdresi({ ...s, rol: null }) });
  if (s.portfoy) liste.push({ anahtar: "portfoy", etiket: "Portföy: Yok", kaldirAdresi: kullaniciAdresi({ ...s, portfoy: null }) });
  if (s.parola) liste.push({ anahtar: "parola", etiket: "Parola: Geçici", kaldirAdresi: kullaniciAdresi({ ...s, parola: null }) });
  return liste;
}

export function bosDurum(s: KullaniciSuzgeci): "hic-kayit" | "suzgecli" {
  return ayniSuzgec(s, BOS_SUZGEC) ? "hic-kayit" : "suzgecli";
}
