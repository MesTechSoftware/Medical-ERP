/**
 * Liste süzgeçlerinin adres parametresi yardımcıları (Doktorlar, Ürünler, Denetim kaydı, Stok).
 * Geçersiz değer `null` döner; süzgeç onu yok sayar. Saf modül.
 */

export type Parametreler = Record<string, string | string[] | undefined>;

const KIMLIK = /^[A-Za-z0-9-]{1,64}$/;

/** Parametrenin ilk değeri; boş metin yok sayılır. */
export function ilk(p: Parametreler, ad: string): string | null {
  const v = p[ad];
  const deger = Array.isArray(v) ? v[0] : v;
  return deger ? deger : null;
}

/** `YYYY-AA-GG` biçiminde gerçek takvim günü. */
export function gun(metin: string | null): string | null {
  const m = metin?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [yil, ay, g] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  const d = new Date(Date.UTC(yil, ay - 1, g));
  return d.getUTCFullYear() === yil && d.getUTCMonth() === ay - 1 && d.getUTCDate() === g ? metin : null;
}

export function secenek<T extends string>(metin: string | null, gecerli: readonly T[]): T | null {
  return gecerli.find((g) => g === metin) ?? null;
}

/** Kayıt kimliği (cuid ve benzeri): harf, rakam, tire; en çok 64 karakter. */
export function kimlik(metin: string | null): string | null {
  return metin !== null && KIMLIK.test(metin) ? metin : null;
}
