/**
 * Ortak sayfalama yardımcısı.
 *
 * Liste sorguları önceden ya sınırsız `findMany` yapıyordu (ürünler, satıcılar,
 * siparişler) ya da sabit bir `take:` ile sessizce kırpıyordu — ikisi de doktor
 * listesi / tahsilat geçmişi / kongre hareket defteri büyüdükçe sorun olur.
 */

export const DEFAULT_PER_PAGE = 25;
export const MAX_PER_PAGE = 100;

export type Pagination = {
  page: number;
  perPage: number;
  skip: number;
  take: number;
};

/** `?page=2&per=50` gibi arama parametrelerini güvenli sayfalamaya çevirir. */
export function getPagination(
  searchParams?: { page?: string; per?: string },
  defaultPerPage: number = DEFAULT_PER_PAGE
): Pagination {
  const rawPage = Number.parseInt(searchParams?.page ?? "", 10);
  const rawPer = Number.parseInt(searchParams?.per ?? "", 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const perPage =
    Number.isFinite(rawPer) && rawPer > 0
      ? Math.min(rawPer, MAX_PER_PAGE)
      : defaultPerPage;

  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

/** Toplam kayıt sayısından sayfa adedini hesaplar (en az 1). */
export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}
