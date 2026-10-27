import type { AuditActionType, AuditModule } from "@/generated/prisma/enums";
import { ISLEM_SINIFI, type AuditAction } from "@/lib/denetim/olaylar";

/**
 * Denetim listesinin süzgeci ve imleci (KARARLAR X-18 §(9)); adres çubuğunda durur. Geçersiz değer
 * yok sayılır. Saf modül: gün metni `zaman.ts`'te aralığa çevrilir (E-1).
 */

/** Kullanıcı süzgecinde aktörsüz kayıtlar (başarısız giriş, seed). */
export const SISTEM = "sistem";

export type DenetimSuzgeci = {
  /** İstanbul günü `YYYY-AA-GG`. */
  baslangic: string | null;
  bitis: string | null;
  /** Kullanıcı kimliği ya da `SISTEM`. */
  kullanici: string | null;
  modul: AuditModule | null;
  tur: AuditActionType | null;
  olay: AuditAction | null;
};

/** `once`: bu sıranın öncesi (daha eski); `sonra`: sonrası (daha yeni). */
export type Imlec = { yon: "once" | "sonra"; seq: number } | null;

export const BOS_SUZGEC: DenetimSuzgeci = { baslangic: null, bitis: null, kullanici: null, modul: null, tur: null, olay: null };

const MODULLER: readonly AuditModule[] = ["SATIS", "STOK", "FINANS", "CARI", "URUN_FIYAT", "ICE_AKTARIM", "KULLANICI"];
const TURLER: readonly AuditActionType[] = ["EKLEME", "GUNCELLEME", "SILME", "OTURUM"];
const KIMLIK = /^[A-Za-z0-9-]{1,64}$/;

type Parametreler = Record<string, string | string[] | undefined>;

function ilk(p: Parametreler, ad: string): string | null {
  const v = p[ad];
  const deger = Array.isArray(v) ? v[0] : v;
  return deger ? deger : null;
}

function gun(metin: string | null): string | null {
  const m = metin?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [yil, ay, g] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  const d = new Date(Date.UTC(yil, ay - 1, g));
  return d.getUTCFullYear() === yil && d.getUTCMonth() === ay - 1 && d.getUTCDate() === g ? metin : null;
}

/** `seq` kolonu 32 bit tamsayıdır; aralık dışı imleç yok sayılır. */
const SEQ_AZAMI = 2_147_483_647;

function seq(metin: string | null): number | null {
  if (metin === null || !/^[1-9]\d{0,9}$/.test(metin)) return null;
  const n = parseInt(metin, 10);
  return n <= SEQ_AZAMI ? n : null;
}

function secenek<T extends string>(metin: string | null, gecerli: readonly T[]): T | null {
  return gecerli.find((g) => g === metin) ?? null;
}

export function suzgecCoz(p: Parametreler): { suzgec: DenetimSuzgeci; imlec: Imlec; kayit: string | null } {
  const kullanici = ilk(p, "kullanici");
  const once = seq(ilk(p, "once"));
  const sonra = seq(ilk(p, "sonra"));
  const kayit = ilk(p, "kayit");
  return {
    suzgec: {
      baslangic: gun(ilk(p, "baslangic")),
      bitis: gun(ilk(p, "bitis")),
      kullanici: kullanici !== null && KIMLIK.test(kullanici) ? kullanici : null,
      modul: secenek(ilk(p, "modul"), MODULLER),
      tur: secenek(ilk(p, "tur"), TURLER),
      olay: secenek(ilk(p, "olay"), Object.keys(ISLEM_SINIFI) as AuditAction[]),
    },
    imlec: once !== null ? { yon: "once", seq: once } : sonra !== null ? { yon: "sonra", seq: sonra } : null,
    kayit: kayit !== null && KIMLIK.test(kayit) ? kayit : null,
  };
}

/** Süzgeci koruyan liste adresi; imleç ve kayıt isteğe bağlı. */
export function denetimAdresi(s: DenetimSuzgeci, ek: { once?: number; sonra?: number; kayit?: string } = {}): string {
  const p = new URLSearchParams();
  for (const [ad, deger] of Object.entries(s)) if (deger !== null) p.set(ad, deger);
  if (ek.once !== undefined) p.set("once", String(ek.once));
  if (ek.sonra !== undefined) p.set("sonra", String(ek.sonra));
  if (ek.kayit !== undefined) p.set("kayit", ek.kayit);
  const q = p.toString();
  return q ? `/audit-logs?${q}` : "/audit-logs";
}
