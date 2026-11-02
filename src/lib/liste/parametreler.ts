/**
 * Liste süzgeçlerinin adres parametresi yardımcıları (Doktorlar, Ürünler, Denetim kaydı, Stok).
 * Geçersiz değer `null` döner; süzgeç onu yok sayar. Saf modül.
 */

import { yerelGunAraligi } from "@/lib/zaman";

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

/**
 * Adresin ham sorgu metni (normalize edilmez); `adlar` verilirse yalnız o parametreler, o sırayla.
 * Süzgeç formları süzgeç alanlarıyla anahtarlanır: alan değeri adreste değişince yeniden kurulur,
 * sunucunun düzelttiği ya da yok saydığı girdi formda kalmaz. Yok ile boş (`ad=`) ayrıdır.
 */
export function sorguMetni(p: Parametreler, adlar?: readonly string[]): string {
  const q = new URLSearchParams();
  for (const [ad, deger] of adlar ? adlar.map((a) => [a, p[a]] as const) : Object.entries(p)) {
    for (const d of Array.isArray(deger) ? deger : deger === undefined ? [] : [deger]) q.append(ad, d);
  }
  return q.toString();
}

/** Kayıt kimliği (cuid ve benzeri): harf, rakam, tire; en çok 64 karakter. */
export function kimlik(metin: string | null): string | null {
  return metin !== null && KIMLIK.test(metin) ? metin : null;
}
