import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { ilk } from "@/lib/liste/parametreler";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { getPagination, pageCount } from "@/lib/pagination";
import { doktorBolgeleri, doktorListesi, saticiDoktorKpileri, saticiDoktorPaneli } from "@/lib/doktor-listesi/sorgu";
import { SATICI_SUTUNLARI, SATICI_SUTUN_CEREZI } from "@/lib/doktor-listesi/sutunlar";
import { ayniSuzgec, doktorAdresi, saticiSuzgeci, suzgecCoz, type Parametreler } from "@/lib/doktor-listesi/suzgec";
import { simdi } from "@/lib/zaman";
import { DoktorPaneli } from "./DoktorPaneli";
import { DoktorTablosu } from "./DoktorTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

const YOL = "/my-doctors";

/**
 * Doktorlarım (spec Ü-32): yönetici Doktorlar ekranının (Ü-18) satıcı kapsamlı hâli — 4 KPI, durum sekmeleri,
 * Filtrele (bölge, durum, son sipariş), sütun seçici, sayfalı liste, yan panel. Kapsam tek kaynaktadır
 * (`kapsamliDoktorlariGetir`, X-13-1): liste, kartlar, bölge seçenekleri ve panel yalnız satıcının carilerini okur.
 */
export default async function MyDoctorsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireSeller();
  const kapsam = kapsamliDoktorlariGetir(session.user);
  const params = await searchParams;
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  const yer = { page, per: per ? perPage : undefined };
  // Bu ekranda olmayan süzgeçler (sınıf, satıcı, fatura; eski `sahip`) sorgulardan önce adresten düşer.
  const suzgec = saticiSuzgeci(cozulen.suzgec);
  if (!ayniSuzgec(suzgec, cozulen.suzgec) || ilk(params, "sahip") !== null) {
    redirect(doktorAdresi(suzgec, { ...yer, ...(detay ? { detay } : {}) }, YOL));
  }
  const an = simdi();
  const gizli = gizliSutunlariCoz(SATICI_SUTUNLARI, (await cookies()).get(SATICI_SUTUN_CEREZI)?.value);
  const adres = doktorAdresi(suzgec, yer, YOL);

  // Dört okuma birbirinden bağımsızdır; tek turda gider.
  const [liste, kpi, bolgeler, panel] = await Promise.all([
    doktorListesi(suzgec, { skip, take }, kapsam, an),
    kpiGetir(() => saticiDoktorKpileri(kapsam, an), { yol: YOL, kullaniciId: session.user.id }),
    doktorBolgeleri(kapsam),
    detay ? saticiDoktorPaneli(detay, kapsam, session.user.id) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(doktorAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }, YOL));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(doktorAdresi(suzgec, {}, YOL), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader
        title="Doktorlarım"
        description="Portföyünüzdeki doktorlar"
        action={<LinkButton href="/my-doctors/new" ikon="yeni">Yeni Doktor</LinkButton>}
      />

      <KpiKartlari sonuc={kpi} />

      <SuzgecCubugu
        suzgec={suzgec}
        bolgeler={bolgeler}
        sutunMenusu={<SutunSecici sutunlar={SATICI_SUTUNLARI} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <DoktorTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} an={an} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath={YOL} params={sayfaParametreleri} />

      {/* Bulunamayan ya da başka satıcının carisinde panel açılmaz. */}
      {panel && <DoktorPaneli key={panel.doktor.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
