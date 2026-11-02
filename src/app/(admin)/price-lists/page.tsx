import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { getPagination, pageCount } from "@/lib/pagination";
import { bugun } from "@/lib/zaman";
import { fiyatListeleri, fiyatListesiKpileri, fiyatListesiPaneli } from "@/lib/fiyat-listesi-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/fiyat-listesi-listesi/sutunlar";
import { listeAdresi, suzgecCoz, type Parametreler } from "@/lib/fiyat-listesi-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { ListePaneli } from "./ListePaneli";
import { ListeTablosu } from "./ListeTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Fiyat listeleri (X-10, spec Ü-21) — yalnız yönetici. Cariye atama cari kartında, satır yazımı detayda. */
export default async function PriceListsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  await requireAdmin();
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination({ page: tek(params.page), per: tek(params.per) });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: tek(params.per) ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = listeAdresi(suzgec, yer);

  // Gün bir kez okunur: "Aktif liste" kartı ile Aktif sekmesi aynı günü sayar (X-10-6).
  const gun = bugun();
  const [liste, sayilar, panel] = await Promise.all([
    fiyatListeleri(suzgec, { skip, take }, gun),
    fiyatListesiKpileri(gun),
    detay ? fiyatListesiPaneli(detay, gun) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(listeAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(listeAdresi(suzgec), "http://x").searchParams),
    per: tek(params.per),
  };

  return (
    <div>
      <PageHeader
        title="Fiyat Listeleri"
        description="Liste fiyatı ve barem satırları. Atanmamış cari varsayılan listeyi kullanır."
        action={<LinkButton href="/price-lists/new" ikon="yeni">Yeni Liste</LinkButton>}
      />

      <KpiKartlari sayilar={sayilar} />

      <SuzgecCubugu
        suzgec={suzgec}
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <ListeTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/price-lists" params={sayfaParametreleri} />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.5). */}
      {panel && <ListePaneli key={panel.liste.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
