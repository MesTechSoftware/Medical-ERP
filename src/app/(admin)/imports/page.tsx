import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { LinkButton, PageHeader } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ilk } from "@/lib/liste/parametreler";
import { getPagination, pageCount } from "@/lib/pagination";
import { partiKpileri, partiListesi, partiPaneli } from "@/lib/ice-aktarim-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/ice-aktarim-listesi/sutunlar";
import { partiAdresi, suzgecCoz, type Parametreler } from "@/lib/ice-aktarim-listesi/suzgec";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { PartiPaneli } from "./PartiPaneli";
import { PartiTablosu } from "./PartiTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

/**
 * İçe aktarım (D-6, X-16) — yalnız yönetici; devreye alma aracı. Partiler süzgeçli ve sayfalı; parti paneli kayıt
 * dağılımını ve geri almayı (X-12, gerekçeli) taşır. Yeni içe aktarım `/imports/new`'dedir (spec Ü-30).
 */
export default async function ImportsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireAdmin();
  const params = await searchParams;
  const bugun = yerelGunMetni(simdi());
  const per = ilk(params, "per") ?? undefined;
  const { page, perPage, skip, take } = getPagination({ page: ilk(params, "page") ?? undefined, per });
  const { suzgec, detay } = suzgecCoz(params);
  const yer = { page, per: per ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = partiAdresi(suzgec, yer);

  const [liste, kpi, panel] = await Promise.all([
    partiListesi(suzgec, { skip, take }),
    kpiGetir(() => partiKpileri(bugun), { yol: "/imports", kullaniciId: session.user.id }),
    detay ? partiPaneli(detay) : null,
  ]);
  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(partiAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(partiAdresi(suzgec), "http://x").searchParams),
    per: yer.per === undefined ? undefined : String(yer.per),
  };

  return (
    <div>
      <PageHeader
        title="İçe Aktarım"
        description="Devreye alma partileri. Yeni içe aktarımda önce doğrulayıp önizleyin; hatalı satır varsa hiçbir kayıt yazılmaz."
        action={
          <LinkButton href="/imports/new" ikon="yeni">
            Yeni İçe Aktarım
          </LinkButton>
        }
      />

      <KpiKartlari sonuc={kpi} bugun={bugun} />

      <SuzgecCubugu suzgec={suzgec} per={yer.per} sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />} />

      <PartiTablosu satirlar={liste.satirlar} gizli={gizli} suzgec={suzgec} yer={yer} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/imports" params={sayfaParametreleri} />

      {/* Bulunmayan parti için panel açılmaz. */}
      {panel && <PartiPaneli key={panel.id} veri={panel} kapatAdresi={adres} />}
    </div>
  );
}
