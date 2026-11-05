/**
 * Liste süzgeçlerinin adres parametresi yardımcıları (Doktorlar, Ürünler, Denetim kaydı, Stok).
 * Geçersiz değer `null` döner; süzgeç onu yok sayar. Saf modül.
 */

import type { Aralik } from "@/lib/donem";
import { TUM_ZAMANLAR, yerelGunAraligi } from "@/lib/zaman";

export type Parametreler = Record<string, string | string[] | undefined>;

const KIMLIK = /^[A-Za-z0-9-]{1,64}$/;

/** Parametrenin ilk değeri; boş metin yok sayılır. */
export function ilk(p: Parametreler, ad: string): string | null {
  const v = p[ad];
  const deger = Array.isArray(v) ? v[0] : v;
  return deger ? deger : null;
}

/** `YYYY-AA-GG` biçiminde gerçek takvim günü; doğrulama `zaman.ts`'in gün çözümüyle aynıdır. */
export function gun(metin: string | null): string | null {
  return metin !== null && yerelGunAraligi(metin) !== null ? metin : null;
}

/** `YYYY-AA-GG` → `GG.AA.YYYY` (süzgeç etiketleri). */
export function gunEtiketi(metin: string): string {
  return metin.split("-").reverse().join(".");
}

/** Gün aralığının etiketi; tek uçta "… sonrası" / "… öncesi". En az bir uç doludur. */
export function aralikEtiketi(bas: string | null, bit: string | null): string {
  if (bas !== null && bit !== null) return `${gunEtiketi(bas)} – ${gunEtiketi(bit)}`;
  return bas !== null ? `${gunEtiketi(bas)} sonrası` : `${gunEtiketi(bit!)} öncesi`;
}

export function secenek<T extends string>(metin: string | null, gecerli: readonly T[]): T | null {
  return gecerli.find((g) => g === metin) ?? null;
}

/** Kayıt kimliği (cuid ve benzeri): harf, rakam, tire; en çok 64 karakter. */
export function kimlik(metin: string | null): string | null {
  return metin !== null && KIMLIK.test(metin) ? metin : null;
}

/** İstanbul gün metinlerini yarı açık aralığa çevirir; boş uç `TUM_ZAMANLAR`'ın ucudur. */
export function gunleriAraliga(a: { baslangic: string | null; bitis: string | null }): Aralik {
  return {
    baslangic: (a.baslangic && yerelGunAraligi(a.baslangic)?.baslangic) || TUM_ZAMANLAR.baslangic,
    bitis: (a.bitis && yerelGunAraligi(a.bitis)?.bitis) || TUM_ZAMANLAR.bitis,
  };
}
