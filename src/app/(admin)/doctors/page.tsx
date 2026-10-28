import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { PageHeader, Card, LinkButton } from "@/components/ui";
import { SAHIPSIZ_DOKTOR } from "@/lib/sahiplik";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { doktorListesi } from "@/lib/doktor-listesi/sorgu";
import { HIZLI_SEKMELER, ayniSuzgec, doktorAdresi, suzgecCoz, type Parametreler } from "@/lib/doktor-listesi/suzgec";
import { simdi } from "@/lib/zaman";
import TransferForm from "./TransferForm";
import { DoktorTablosu } from "./DoktorTablosu";

const tek = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminDoctorsPage({ searchParams }: { searchParams: Promise<Parametreler> }) {
  const session = await requireStaff();
  // Cariyi OPERASYON da görür (X-13 §(1)); devir yalnız YONETICI (X-13 §(5)) — yetki action'dadır.
  const devirYetkisi = session.user.role === "YONETICI";
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination({ page: tek(params.page), per: tek(params.per) });
  // X-8 §(5) hesap sınıfı, A-13 §(5) eksik fatura bilgisi ve diğer süzgeçler birleşir (X-8-4).
  const { suzgec } = suzgecCoz(params);
  const an = simdi();

  // FR-05: admin TÜM doktorları görür.
  const [liste, unowned, sellers] = await Promise.all([
    doktorListesi(suzgec, { skip, take }, an),
    prisma.doctor.count({ where: SAHIPSIZ_DOKTOR }),
    prisma.user.findMany({
      where: { role: "SATICI", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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

      {unowned > 0 && (
        <div className="mb-4 rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-sm text-critical">
          <strong>{unowned}</strong> doktor sahipsiz havuzda. Bir satıcıya
          atanana kadar bu doktorlara sipariş girilemez.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {HIZLI_SEKMELER.map((f) => (
          <Link
            key={f.etiket}
            href={doktorAdresi(f.suzgec)}
            className={
              "inline-flex h-(--toolbar-h) items-center rounded-full px-3 text-sm font-medium transition " +
              (ayniSuzgec(suzgec, f.suzgec)
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
            }
          >
            {f.etiket}
          </Link>
        ))}
      </div>

      {/* Toplu devir (X-17 §(4)): satırlardaki kutular bu forma `form` niteliğiyle bağlıdır. */}
      {devirYetkisi && (
        <div className="mb-4">
          <Card>
            <TransferForm formId="toplu-devir" sellers={sellers} />
          </Card>
        </div>
      )}

      <DoktorTablosu satirlar={liste.satirlar} gizli={new Set()} devirYetkisi={devirYetkisi} suzgec={suzgec} an={an} />

      <Pagination
        page={page}
        totalPages={pageCount(liste.toplam, perPage)}
        total={liste.toplam}
        basePath="/doctors"
        params={sayfaParametreleri}
      />
    </div>
  );
}
