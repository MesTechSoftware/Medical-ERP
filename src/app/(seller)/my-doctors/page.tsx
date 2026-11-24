import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { PageHeader, LinkButton } from "@/components/ui";
import { ListeSayfalama } from "@/components/liste/ListeSayfalama";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlar } from "@/lib/liste/sutun-tercihi";
import { kpiGetir } from "@/lib/kpi/getir";
import { ilk } from "@/lib/liste/parametreler";
import { sayfaCoz, sayfaDisi } from "@/lib/liste/sayfa";
import { doktorBolgeleri, doktorListesi, saticiDoktorKpileri, saticiDoktorPaneli } from "@/lib/doktor-listesi/sorgu";
import { ayniSuzgec, doktorAdresi, saticiSuzgeci, suzgecCoz, type Parametreler } from "@/lib/doktor-listesi/suzgec";
import { simdi } from "@/lib/zaman";
import { DoktorPaneli } from "./DoktorPaneli";
import { DoktorTablosu } from "./DoktorTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";

const YOL = "/my-doctors";

/**
 * Doktorlarım (spec Ü-32): yönetici Doktorlar ekranının (Ü-18) satıcı kapsamlı hâli — 4 KPI, durum sekmeleri,
 * Filtrele (bölge, durum, son sipariş), sütun seçici, sayfalı liste, yan panel. Kapsam tek kaynaktadır
 * (`kapsamliDoktorlariGetir`, X-13-1): liste, kartlar, bölge seçenekleri ve panel yalnız satıcının carilerini okur.
 */
export const metadata: Metadata = { title: "Doktorlarım" };

export default async function MyDoctorsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireSeller();
  const kapsam = kapsamliDoktorlariGetir(session.user);
  const params = await searchParams;
  const sayfa = sayfaCoz(params);
  const { perPage, skip, take, yer } = sayfa;
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  // Bu ekranda olmayan süzgeçler (sınıf, satıcı, fatura; eski `sahip`) sorgulardan önce adresten düşer.
  const suzgec = saticiSuzgeci(cozulen.suzgec);
  if (!ayniSuzgec(suzgec, cozulen.suzgec) || ilk(params, "sahip") !== null) {
    redirect(doktorAdresi(suzgec, { ...yer, ...(detay ? { detay } : {}) }, YOL));
  }
  const an = simdi();
  const gizli = await gizliSutunlar("/my-doctors");
  const adres = doktorAdresi(suzgec, yer, YOL);

  // Dört okuma birbirinden bağımsızdır; tek turda gider.
  const [liste, kpi, bolgeler, panel] = await Promise.all([
    doktorListesi(suzgec, { skip, take }, kapsam, an, false),
    kpiGetir(() => saticiDoktorKpileri(kapsam, an), { yol: YOL, kullaniciId: session.user.id }),
    doktorBolgeleri(kapsam),
    detay ? saticiDoktorPaneli(detay, kapsam, session.user.id) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  const son = sayfaDisi(liste, perPage);
  if (son !== null) {
    redirect(doktorAdresi(suzgec, { ...yer, page: son, ...(detay ? { detay } : {}) }, YOL));
  }

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
        sutunMenusu={<SutunSecici liste="/my-doctors" gizli={gizli} donus={adres} />}
      />

      <DoktorTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} an={an} />

      <ListeSayfalama sayfa={sayfa} toplam={liste.toplam} adres={doktorAdresi(suzgec, {}, YOL)} />

      {/* Bulunamayan ya da başka satıcının carisinde panel açılmaz. */}
      {panel && <DoktorPaneli key={panel.doktor.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
