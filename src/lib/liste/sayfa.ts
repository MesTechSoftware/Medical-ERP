/**
 * Liste ekranlarının sayfa akışı: adresten sayfa ve sayfa boyu, sayfa dışı adresin gideceği son sayfa,
 * sayfalama bağlantılarının parametreleri. Saf modül.
 */

import { ilk, type Parametreler } from "@/lib/liste/parametreler";
import { DEFAULT_PER_PAGE, getPagination, pageCount, type Pagination } from "@/lib/pagination";

/** Adrese yazılan sayfa konumu: `per` yalnız adreste geçerli bir değer varsa taşınır. */
export type Yer = { page: number; per?: number };

export type ListeSayfasi = Pagination & { yer: Yer };

const SAYI = /^\d+$/;

/**
 * Geçersiz `page`/`per` (harf, sıfır, ondalık, taşan sayı) yok sayılır: sayfa 1'e, boy varsayılana düşer ve
 * bağlantılara yazılmaz; çok büyük `per` sınıra iner, çok büyük `page` son sayfaya yönlendirilir (`sayfaDisi`).
 */
export function sayfaCoz(p: Parametreler, varsayilan: number = DEFAULT_PER_PAGE): ListeSayfasi {
  const per = sayi(ilk(p, "per"));
  const sayfa = getPagination({ page: sayi(ilk(p, "page")), per }, varsayilan);
  return { ...sayfa, yer: { page: sayfa.page, per: per === undefined ? undefined : sayfa.perPage } };
}

/** Yalnız rakamlardan oluşan, sıfırdan büyük, güvenli tam sayı; değilse yok sayılır (harf, ondalık, taşma). */
function sayi(metin: string | null): string | undefined {
  if (metin === null || !SAYI.test(metin)) return undefined;
  const n = parseInt(metin, 10);
  return n > 0 && Number.isSafeInteger(n) ? metin : undefined;
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
  const parametreler = new URL(suzgecliAdres, "http://x").searchParams;
  // Konum ve panel parametreleri adresle gelse de taşınmaz: sayfa bağlantısı paneli yeniden açmasın.
  for (const ad of KONUM_PARAMETRELERI) parametreler.delete(ad);
  return { ...Object.fromEntries(parametreler), per: yer.per === undefined ? undefined : String(yer.per) };
}

const KONUM_PARAMETRELERI = ["page", "per", "detay", "kismi"] as const;
