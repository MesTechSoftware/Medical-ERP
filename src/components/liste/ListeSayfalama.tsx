import Pagination from "@/components/Pagination";
import { pageCount } from "@/lib/pagination";
import { sayfalamaParametreleri, type ListeSayfasi } from "@/lib/liste/sayfa";

/**
 * Liste ekranının sayfalaması: `adres` süzgeçli liste adresidir (sayfasız, panelsiz); bağlantılar süzgeci
 * ve geçerli sayfa boyunu korur.
 */
export function ListeSayfalama({ sayfa, toplam, adres }: { sayfa: ListeSayfasi; toplam: number; adres: string }) {
  return (
    <Pagination
      page={sayfa.page}
      totalPages={pageCount(toplam, sayfa.perPage)}
      total={toplam}
      basePath={new URL(adres, "http://x").pathname}
      params={sayfalamaParametreleri(adres, sayfa.yer)}
    />
  );
}
