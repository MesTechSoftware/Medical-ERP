import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { firmaSecenekleri, kargoBekleyenler, kargoKpileri, kismiSecimi, sevkiyatListesi } from "@/lib/kargo-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/kargo-listesi/sutunlar";
import { FIRMASIZ, kargoAdresi, suzgecCoz, type Parametreler } from "@/lib/kargo-listesi/suzgec";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { BekleyenTablosu } from "./BekleyenTablosu";
import { KismiPanel } from "./KismiPanel";
import { KpiKartlari } from "./KpiKartlari";
import { SevkiyatTablosu } from "./SevkiyatTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

export default async function ShippingPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const { suzgec, kismi } = suzgecCoz(params);
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = kargoAdresi(suzgec, yer);
  const bugun = yerelGunMetni(simdi());

  const [bekleyenler, liste, firmalar] = await Promise.all([kargoBekleyenler(), sevkiyatListesi(suzgec, { skip, take }), firmaSecenekleri()]);
  const kpi = await kpiGetir(() => kargoKpileri(bugun, bekleyenler), { yol: "/shipping", kullaniciId: session.user.id });

  // Seçeneklerde olmayan firma süzgeci (eski yer imi, elle yazılmış kimlik) adresten düşer.
  if (suzgec.firma && suzgec.firma !== FIRMASIZ && !firmalar.some((f) => f.id === suzgec.firma)) {
    redirect(kargoAdresi({ ...suzgec, firma: null }, { ...yer, ...(kismi ? { kismi } : {}) }));
  }
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(kargoAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(kismi ? { kismi } : {}) }));
  }

  const aktifFirmalar = firmalar.filter((f) => f.isActive);
  const panel = kismiSecimi(bekleyenler, kismi);
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(kargoAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader title="Kargo" description="Hazırlanan siparişleri kargoya verin" />

      <KpiKartlari sonuc={kpi} bugun={bugun} yonetici={session.user.role === "YONETICI"} />

      <div className="mb-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Kargo Bekleyenler ({bekleyenler.length})</h2>
          <BekleyenTablosu satirlar={bekleyenler} firmalar={aktifFirmalar} kismiAdresi={(id) => kargoAdresi(suzgec, { ...yer, kismi: id })} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Sevkiyatlar</h2>
        <SuzgecCubugu
          suzgec={suzgec}
          bugun={bugun}
          per={yer.per}
          firmalar={firmalar}
          sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
        />
        <SevkiyatTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} />
      </Card>

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/shipping" params={sayfaParametreleri} />

      {/* Kargo bekleyen olmayan sipariş için panel açılmaz (spec §3.4). */}
      {panel && <KismiPanel key={panel.id} r={panel} firmalar={aktifFirmalar} kapatAdresi={adres} />}
    </div>
  );
}
