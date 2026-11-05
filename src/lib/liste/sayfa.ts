/**
 * Liste ekranlarının sayfa akışı: adresten sayfa ve sayfa boyu, sayfa dışı adresin gideceği son sayfa,
 * sayfalama bağlantılarının parametreleri. Saf modül.
 */

import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import { DEFAULT_PER_PAGE, getPagination, pageCount, type Pagination } from "@/lib/pagination";

/** Adrese yazılan sayfa konumu: `per` yalnız adreste geçerli bir değer varsa taşınır. */
export type Yer = { page: number; per?: number };

export type ListeSayfasi = Pagination & { yer: Yer };

const SAYI = /^[1-9]\d*$/;

/** Geçersiz `per` (harf, sıfır, boş) varsayılana düşer ve bağlantılara yazılmaz; çok büyüğü sınıra iner. */
export function sayfaCoz(p: Parametreler, varsayilan: number = DEFAULT_PER_PAGE): ListeSayfasi {
  const ham = ilk(p, "per");
  const per = ham !== null && SAYI.test(ham) ? ham : undefined;
  const sayfa = getPagination({ page: ilk(p, "page") ?? undefined, per }, varsayilan);
  return { ...sayfa, yer: { page: sayfa.page, per: per === undefined ? undefined : sayfa.perPage } };
}

/**
 * Satırsız ama kayıtlı sayfa (son sayfanın satırı silinmiş, elle büyük sayfa yazılmış): gidilecek son sayfa.
 * Boş durum "hiç kayıt yok" demesin diye sayfa yönlendirir. Sayfa içindeyse `null`.
 */
export function sayfaDisi(liste: { satirlar: readonly unknown[]; toplam: number }, perPage: number): number | null {
  return liste.satirlar.length === 0 && liste.toplam > 0 ? pageCount(liste.toplam, perPage) : null;
}

/** Sayfalama bağlantılarının parametreleri: süzgeçli liste adresi ve (geçerliyse) sayfa boyu; paneli taşımaz. */
export function sayfalamaParametreleri(suzgecliAdres: string, yer: Yer): Record<string, string | undefined> {
  return {
    ...Object.fromEntries(new URL(suzgecliAdres, "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };
}
