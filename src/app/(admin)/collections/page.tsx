import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { LinkButton, PageHeader } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { tahsilatKpileri, tahsilatListesi, tahsilatPaneli } from "@/lib/tahsilat-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/tahsilat-listesi/sutunlar";
import { kpiAraligi, suzgecCoz, tahsilatAdresi, type Parametreler } from "@/lib/tahsilat-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { TahsilatPaneli } from "./TahsilatPaneli";
import { TahsilatTablosu } from "./TahsilatTablosu";
import { sutunlariKaydet } from "./sutunEylemi";

/**
 * Tahsilatlar (spec Ü-26): dönemin tahsilatı ve yöntem kırılımı, süzgeçli liste ve toplamı, tahsilat paneli
 * (donmuş komisyon, carinin bakiyesi, gerekçeli iptal). Yeni tahsilat `/collections/new`'dedir.
 */
export default async function CollectionsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  const params = await searchParams;
  const bugun = yerelGunMetni(simdi());
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = tahsilatAdresi(suzgec, yer);
  const aralik = kpiAraligi(suzgec, bugun);

  const [liste, kpi, panel] = await Promise.all([
    tahsilatListesi(suzgec, { skip, take }),
    kpiGetir(() => tahsilatKpileri(aralik), { yol: "/collections", kullaniciId: session.user.id }),
    detay ? tahsilatPaneli(detay) : null,
  ]);
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(tahsilatAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(tahsilatAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader
        title="Tahsilatlar"
        description="Carilerden yapılan tahsilatlar ve iptalleri."
        action={
          <LinkButton href="/collections/new" ikon="yeni">
            Yeni Tahsilat
          </LinkButton>
        }
      />

      <KpiKartlari sonuc={kpi} aralik={aralik} />

      <SuzgecCubugu
        suzgec={suzgec}
        bugun={bugun}
        per={yer.per}
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <TahsilatTablosu satirlar={liste.satirlar} ozet={liste.ozet} gizli={gizli} suzgec={suzgec} yer={yer} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/collections" params={sayfaParametreleri} />

      {/* Bulunmayan tahsilat için panel açılmaz (spec §5). */}
      {panel && <TahsilatPaneli key={panel.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
