import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import { BilgiSeridi } from "@/components/BilgiSeridi";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SiparisPaneli } from "@/components/siparis/SiparisPaneli";
import { SiparisTablosu } from "@/components/siparis/SiparisTablosu";
import { SuzgecCubugu } from "@/components/siparis/SuzgecCubugu";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { ilk } from "@/lib/liste/parametreler";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { siparisListesi, siparisPaneli, siparisSekmeSayilari } from "@/lib/siparis-listesi/sorgu";
import { siparisAdresi, suzgecCoz, type Parametreler } from "@/lib/siparis-listesi/suzgec";

const YOL = "/my-orders";

/**
 * Siparişlerim (spec Ü-31): yönetici Siparişler ekranının (Ü-23) satıcı kapsamlı hâli — durum sekmeleri ve sayıları,
 * Filtrele (tarih, metin), sütun seçici, sayfalı liste, yan panel. Kapsam sorgudadır (`kapsam`, X-13):
 * liste, kartlar ve panel yalnız bu satıcının siparişlerini okur; adresteki `satici` adresten düşer.
 */
export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireSeller();
  const saticiId = session.user.id;
  const kapsam = { tur: "satici", saticiId } as const;
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  // Satıcı süzgeci bu ekranda yoktur; adreste kalmışsa (yönetici bağlantısı, elle) sorgulardan önce adresten düşer.
  // Kapsam zaten sorgudadır — bu yalnız adres çubuğunun uygulanan süzgeci göstermesi içindir.
  const suzgec = { ...cozulen.suzgec, satici: null };
  if (ilk(params, "satici") !== null) redirect(siparisAdresi(suzgec, { ...yer, ...(detay ? { detay } : {}) }, YOL));
  const gizli = await gizliSutunlar("/my-orders");
  const adres = siparisAdresi(suzgec, yer, YOL);

  // Üç okuma birbirinden bağımsızdır; tek turda gider.
  const [liste, sayilar, panel] = await Promise.all([
    siparisListesi(suzgec, { skip, take }, kapsam),
    siparisSekmeSayilari(suzgec, kapsam),
    detay ? siparisPaneli(detay, kapsam) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(siparisAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }, YOL));
  }

  return (
    <div>
      <PageHeader
        title="Siparişlerim"
        description="Oluşturduğunuz siparişler"
        action={<LinkButton href="/my-orders/new" ikon="yeni">Yeni Sipariş</LinkButton>}
      />

      <BilgiSeridi ham={params.bilgi} />

      <SuzgecCubugu
        suzgec={suzgec}
        sayilar={sayilar}
        per={yer.per}
        yol={YOL}
        sutunMenusu={<SutunSecici liste="/my-orders" gizli={gizli} donus={adres} />}
      />

      <SiparisTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} yol={YOL} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={siparisAdresi(suzgec, {}, YOL)} />

      {/* Bulunamayan ya da başka satıcının kimliğinde panel açılmaz. */}
      {panel && <SiparisPaneli key={panel.siparis.id} veri={panel} kapatAdresi={adres} yol={YOL} />}
    </div>
  );
}
