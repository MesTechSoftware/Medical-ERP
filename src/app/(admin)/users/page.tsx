import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { getPagination, pageCount } from "@/lib/pagination";
import { kullaniciKpileri, kullaniciListesi, kullaniciPaneli } from "@/lib/kullanici-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/kullanici-listesi/sutunlar";
import { kullaniciAdresi, suzgecCoz, type GorenRol, type Parametreler } from "@/lib/kullanici-listesi/suzgec";
import { KpiKartlari } from "./KpiKartlari";
import { KullaniciPaneli } from "./KullaniciPaneli";
import { KullaniciTablosu } from "./KullaniciTablosu";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { sutunlariKaydet } from "./sutunEylemi";

const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Kullanıcı sayısı küçüktür; varsayılan sayfa bütün ekibi gösterir (spec Ü-22 §3.4). */
const SAYFA_BOYU = 100;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // Kullanıcı yönetimi yalnız YONETICI'dedir. OPERASYON yalnız satıcıları görür ve salt okur (D-2, E-2).
  const gorenRol: GorenRol = session.user.role === "YONETICI" ? "YONETICI" : "OPERASYON";
  const yonetici = gorenRol === "YONETICI";
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination({ page: tek(params.page), per: tek(params.per) }, SAYFA_BOYU);
  const { suzgec, detay } = suzgecCoz(params, gorenRol);
  const yer = { page, per: tek(params.per) ? perPage : undefined };
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const adres = kullaniciAdresi(suzgec, yer);

  const [liste, sayilar, panel] = await Promise.all([
    kullaniciListesi(suzgec, gorenRol, { skip, take }),
    kullaniciKpileri(gorenRol),
    detay ? kullaniciPaneli(detay, gorenRol) : null,
  ]);

  // Sayfa dışı adres son sayfaya gider; boş durum "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(kullaniciAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(kullaniciAdresi(suzgec), "http://x").searchParams),
    per: tek(params.per),
  };

  return (
    <div>
      <PageHeader
        title="Kullanıcılar"
        description={yonetici ? "Hesaplar yalnız buradan açılır" : "Satıcılar"}
        action={yonetici && <LinkButton href="/users/new" ikon="yeni">Yeni Kullanıcı</LinkButton>}
      />

      <KpiKartlari sayilar={sayilar} gorenRol={gorenRol} />

      <SuzgecCubugu
        suzgec={suzgec}
        gorenRol={gorenRol}
        sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={adres} />}
      />

      <KullaniciTablosu satirlar={liste.satirlar} gizli={gizli} yonetici={yonetici} suzgec={suzgec} yer={yer} />

      <Pagination page={page} totalPages={pageCount(liste.toplam, perPage)} total={liste.toplam} basePath="/users" params={sayfaParametreleri} />

      {/* Kapsam dışı ya da bulunamayan kimlikte panel açılmaz (spec §5, D-2-3). */}
      {panel && <KullaniciPaneli key={panel.kullanici.id} veri={panel} kapatAdresi={adres} yonetici={yonetici} />}
    </div>
  );
}
