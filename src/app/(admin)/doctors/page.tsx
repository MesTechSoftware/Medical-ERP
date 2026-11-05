import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { doktorKpileri, doktorListesi, doktorPaneli, doktorSuzgecSecenekleri } from "@/lib/doktor-listesi/sorgu";
import { SUTUNLAR, SUTUN_CEREZI, gizliSutunlariCoz } from "@/lib/doktor-listesi/sutunlar";
import { doktorAdresi, saticiyiDogrula, suzgecCoz, type Parametreler } from "@/lib/doktor-listesi/suzgec";
import { simdi } from "@/lib/zaman";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import TransferForm from "./TransferForm";
import { DoktorPaneli } from "./DoktorPaneli";
import { DoktorTablosu } from "./DoktorTablosu";
import { KpiKartlari } from "./KpiKartlari";
import { SuzgecCubugu } from "./SuzgecCubugu";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { sutunlariKaydet } from "./sutunEylemi";

const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminDoctorsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // Cariyi OPERASYON da görür (X-13 §(1)); devir yalnız YONETICI (X-13 §(5)) — yetki action'dadır.
  const devirYetkisi = session.user.role === "YONETICI";
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination({ page: tek(params.page), per: tek(params.per) });
  // X-8 §(5) hesap sınıfı, A-13 §(5) eksik fatura bilgisi ve diğer süzgeçler birleşir (X-8-4).
  const cozulen = suzgecCoz(params);
  const detay = cozulen.detay;
  const an = simdi();
  // Bilinmeyen ya da pasif satıcı süzgeci yok sayılır: liste, etiket ve sayaç aynı süzgeci görür.
  const secenekler = await doktorSuzgecSecenekleri();
  const suzgec = saticiyiDogrula(cozulen.suzgec, secenekler.saticilar.map((s) => s.id));
  const yer = { page, per: tek(params.per) ? perPage : undefined };
  // Sütun tercihi çerezdedir; gizli sütun hiç çizilmez (spec §3.4).
  const gizli = gizliSutunlariCoz((await cookies()).get(SUTUN_CEREZI)?.value);
  const listeAdresi = doktorAdresi(suzgec, yer);

  // FR-05: admin TÜM doktorları görür.
  const [liste, sayilar, panel] = await Promise.all([
    doktorListesi(suzgec, { skip, take }, kapsamliDoktorlariGetir(session.user), an),
    doktorKpileri(),
    detay ? doktorPaneli(detay) : null,
  ]);

  // Son sayfanın satırı silinmiş ya da elle büyük sayfa yazılmışsa son sayfaya gidilir; boş durum
  // "hiç kayıt yok" demesin.
  if (liste.satirlar.length === 0 && liste.toplam > 0) {
    redirect(doktorAdresi(suzgec, { ...yer, page: pageCount(liste.toplam, perPage), ...(detay ? { detay } : {}) }));
  }

  // Sayfalama süzgeci ve sayfa boyunu korur; paneli taşımaz.
  const sayfaParametreleri = {
    ...Object.fromEntries(new URL(doktorAdresi(suzgec), "http://x").searchParams),
    per: tek(params.per),
  };

  return (
    <div>
      <PageHeader
        title="Doktorlar"
        description="Doktor ve bayi carileri, satıcı devirleri"
        action={devirYetkisi ? <LinkButton href="/doctors/new" ikon="yeni">Yeni Cari</LinkButton> : undefined}
      />

      <KpiKartlari sayilar={sayilar} />

      {sayilar.sahipsiz > 0 && (
        <div className="mb-4 rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-sm text-critical">
          <strong>{sayilar.sahipsiz}</strong> doktor sahipsiz havuzda. Bir satıcıya
          atanana kadar bu doktorlara sipariş girilemez.
        </div>
      )}

      <SuzgecCubugu suzgec={suzgec} secenekler={secenekler} sutunMenusu={<SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={listeAdresi} />} />

      {/* Toplu devir (X-17 §(4)): satırlardaki kutular bu forma `form` niteliğiyle bağlıdır. */}
      {devirYetkisi && (
        <div className="mb-4">
          <Card>
            <TransferForm formId="toplu-devir" sellers={secenekler.saticilar} />
          </Card>
        </div>
      )}

      <DoktorTablosu satirlar={liste.satirlar} gizli={gizli} devirYetkisi={devirYetkisi} suzgec={suzgec} yer={yer} an={an} />

      <Pagination
        page={page}
        totalPages={pageCount(liste.toplam, perPage)}
        total={liste.toplam}
        basePath="/doctors"
        params={sayfaParametreleri}
      />

      {/* Geçersiz ya da bulunamayan kimlikte panel açılmaz (spec §3.6). */}
      {panel && (
        <DoktorPaneli key={panel.doktor.id} veri={panel} kapatAdresi={listeAdresi} yonetici={devirYetkisi} />
      )}
    </div>
  );
}
