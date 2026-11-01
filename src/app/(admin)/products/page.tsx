import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { getPagination, pageCount } from "@/lib/pagination";
import { urunKpileri, urunListesi, urunPaneli } from "@/lib/urun-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/urun-listesi/sutunlar";
import { suzgecCoz, urunAdresi, type Parametreler } from "@/lib/urun-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { UrunPaneli } from "./UrunPaneli";
import { UrunTablosu } from "./UrunTablosu";
import { sutunlariKaydet } from "./sutunEylemi";

const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // OPERASYON ürünü görür, açmaz ve düzenlemez (D-2 17.10 eki); yetki action'dadır.
  const yonetici = session.user.role === "YONETICI";
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination({ page: tek(params.page), per: tek(params.per) });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: tek(params.per) ? perPage : undefined };
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez, çerez yoksa KDV dahil gizlidir (spec §3.4).
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const listeAdresi = urunAdresi(suzgec, yer);

  // Liste fiyatı varsayılan listenin satırıdır (X-10 §(5)); stok hareketlerden türer (ADR-005).
  const [liste, sayilar, panel] = await Promise.all([
    urunListesi(suzgec, { skip, take }),
    urunKpileri(),
    detay ? urunPaneli(detay) : null,
  ]);

  // Son sayfanın satırı silinmiş ya da elle büyük sayfa yazılmışsa son sayfaya gidilir; boş durum
  // "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(urunAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  // Sayfalama süzgeci ve sayfa boyunu korur; paneli taşımaz.
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(urunAdresi(suzgec), "http://x").searchParams),
    per: tek(params.per),
  };

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kataloğu ve güncel stok durumu"
        action={yonetici && <LinkButton href="/products/new" ikon="yeni">Yeni Ürün</LinkButton>}
      />

      <KpiKartlari sayilar={sayilar} />

      <SuzgecCubugu
        suzgec={suzgec}
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={listeAdresi} />}
      />

      <UrunTablosu satirlar={liste.satirlar} gizli={gizli} yonetici={yonetici} suzgec={suzgec} yer={yer} />

      <Pagination
        page={page}
        totalPages={pageCount(liste.toplam, perPage)}
        total={liste.toplam}
        basePath="/products"
        params={sayfaParametreleri}
      />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.6). */}
      {panel && <UrunPaneli key={panel.urun.id} veri={panel} kapatAdresi={listeAdresi} yonetici={yonetici} />}
    </div>
  );
}
