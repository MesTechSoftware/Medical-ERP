import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { urunKpileri, urunListesi, urunPaneli } from "@/lib/urun-listesi/sorgu";
import { suzgecCoz, urunAdresi, type Parametreler } from "@/lib/urun-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { UrunPaneli } from "./UrunPaneli";
import { UrunTablosu } from "./UrunTablosu";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // OPERASYON ürünü görür, açmaz ve düzenlemez (D-2 17.10 eki); yetki action'dadır.
  const yonetici = session.user.role === "YONETICI";
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const { suzgec, detay } = suzgecCoz(params);
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez, çerez yoksa KDV dahil gizlidir (spec §3.4).
  const gizli = await gizliSutunlar("/products");
  const listeAdresi = urunAdresi(suzgec, yer);

  // Liste fiyatı varsayılan listenin satırıdır (X-10 §(5)); stok hareketlerden türer (ADR-005).
  const [liste, sayilar, panel] = await Promise.all([
    urunListesi(suzgec, { skip, take }),
    urunKpileri(),
    detay ? urunPaneli(detay) : null,
  ]);

  // Son sayfanın satırı silinmiş ya da elle büyük sayfa yazılmışsa son sayfaya gidilir; boş durum
  // "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(urunAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }));
  }

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
        sutunMenusu={<SutunSecici liste="/products" gizli={gizli} donus={listeAdresi} />}
      />

      <UrunTablosu satirlar={liste.satirlar} gizli={gizli} yonetici={yonetici} suzgec={suzgec} yer={yer} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={urunAdresi(suzgec)} />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.6). */}
      {panel && <UrunPaneli key={panel.urun.id} veri={panel} kapatAdresi={listeAdresi} yonetici={yonetici} />}
    </div>
  );
}
