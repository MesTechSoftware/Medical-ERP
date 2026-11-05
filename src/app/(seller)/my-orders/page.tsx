import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { KpiKartlari } from "@/components/siparis/KpiKartlari";
import { SiparisPaneli } from "@/components/siparis/SiparisPaneli";
import { SiparisTablosu } from "@/components/siparis/SiparisTablosu";
import { SuzgecCubugu } from "@/components/siparis/SuzgecCubugu";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { gunleriAraliga, siparisKpileri, siparisListesi, siparisPaneli } from "@/lib/siparis-listesi/sorgu";
import { SATICI_SUTUNLARI, SATICI_SUTUN_CEREZI } from "@/lib/siparis-listesi/sutunlar";
import { kpiAraligi, siparisAdresi, suzgecCoz, type Parametreler } from "@/lib/siparis-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { sutunlariKaydet } from "./sutunEylemi";

const YOL = "/my-orders";

/**
 * Siparişlerim (spec Ü-31): yönetici Siparişler ekranının (Ü-23) satıcı kapsamlı hâli — KPI, durum sekmeleri,
 * Filtrele (tarih, metin), sütun seçici, sayfalı liste, yan panel. Kapsam sorgudadır (`kapsam`, X-13):
 * liste, kartlar ve panel yalnız bu satıcının siparişlerini okur; adresteki `satici` adresten düşer.
 */
export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireSeller();
  const saticiId = session.user.id;
  const kapsam = { tur: "satici", saticiId } as const;
  const params = await searchParams;
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  const yer = { page, per: per ? perPage : undefined };
  // Satıcı süzgeci bu ekranda yoktur; adreste kalmışsa (yönetici bağlantısı, elle) sorgulardan önce adresten düşer.
  // Kapsam zaten sorgudadır — bu yalnız adres çubuğunun uygulanan süzgeci göstermesi içindir.
  const suzgec = { ...cozulen.suzgec, satici: null };
  if (ilk(params, "satici") !== null) redirect(siparisAdresi(suzgec, { ...yer, ...(detay ? { detay } : {}) }, YOL));
  const gizli = gizliSutunlariCoz(SATICI_SUTUNLARI, (await cookies()).get(SATICI_SUTUN_CEREZI)?.value);
  const adres = siparisAdresi(suzgec, yer, YOL);
  const aralik = kpiAraligi(suzgec, yerelGunMetni(simdi()));

  // Üç okuma birbirinden bağımsızdır; tek turda gider.
  const [liste, kpi, panel] = await Promise.all([
    siparisListesi(suzgec, { skip, take }, kapsam),
    kpiGetir(() => siparisKpileri(gunleriAraliga(aralik), kapsam), { yol: YOL, kullaniciId: saticiId }),
    detay ? siparisPaneli(detay, kapsam) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(siparisAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }, YOL));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(siparisAdresi(suzgec, {}, YOL), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader
        title="Siparişlerim"
        description="Oluşturduğunuz siparişler"
        action={<LinkButton href="/my-orders/new" ikon="yeni">Yeni Sipariş</LinkButton>}
      />

      <KpiKartlari sonuc={kpi} aralik={aralik} yol={YOL} />

      <SuzgecCubugu
        suzgec={suzgec}
        per={yer.per}
        yol={YOL}
        sutunMenusu={<SutunSecici sutunlar={SATICI_SUTUNLARI} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <SiparisTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} yol={YOL} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath={YOL} params={sayfaParametreleri} />

      {/* Bulunamayan ya da başka satıcının kimliğinde panel açılmaz. */}
      {panel && <SiparisPaneli key={panel.siparis.id} veri={panel} kapatAdresi={adres} yol={YOL} />}
    </div>
  );
}
