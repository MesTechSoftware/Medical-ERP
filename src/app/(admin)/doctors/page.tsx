import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { PageHeader, Card, StatusBadge, EmptyRow, LinkButton } from "@/components/ui";
import { EKSIK_FATURA_BILGISI } from "@/lib/cari";
import { SAHIPSIZ_DOKTOR } from "@/lib/sahiplik";
import type { Prisma } from "@/generated/prisma/client";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import TransferForm from "./TransferForm";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string; sahip?: string; sinif?: string; fatura?: string }>;
}) {
  const session = await requireStaff();
  // Cariyi OPERASYON da görür (X-13 §(1)); devir yalnız YONETICI (X-13 §(5)) — yetki action'dadır.
  const devirYetkisi = session.user.role === "YONETICI";
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination(params);

  const sahipsizSuzgec = params.sahip === "yok";
  // X-8 §(5): liste hesap sınıfıyla süzülür; A-13 §(5): eksik fatura bilgisi süzgeci (bilgi kademesi).
  const sinif = params.sinif === "BAYI" || params.sinif === "DOKTOR" ? params.sinif : null;
  const eksikFatura = params.fatura === "eksik";
  const where: Prisma.DoctorWhereInput = {
    AND: [
      sahipsizSuzgec ? SAHIPSIZ_DOKTOR : {},
      sinif ? { accountClass: sinif } : {},
      eksikFatura ? EKSIK_FATURA_BILGISI : {},
    ],
  };

  // FR-05: admin TÜM doktorları görür.
  const [doctors, total, unowned, sellers] = await Promise.all([
    prisma.doctor.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip,
      take,
      include: {
        ownerSeller: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.doctor.count({ where }),
    prisma.doctor.count({ where: SAHIPSIZ_DOKTOR }),
    prisma.user.findMany({
      where: { role: "SATICI", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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
        {[
          { href: "/doctors", label: "Tümü", active: !sahipsizSuzgec && !sinif && !eksikFatura },
          { href: "/doctors?sinif=DOKTOR", label: "Doktorlar", active: sinif === "DOKTOR" },
          { href: "/doctors?sinif=BAYI", label: "Bayiler", active: sinif === "BAYI" },
          { href: "/doctors?sahip=yok", label: "Sahipsiz", active: sahipsizSuzgec },
          { href: "/doctors?fatura=eksik", label: "Eksik fatura bilgisi", active: eksikFatura },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={
              "inline-flex h-(--toolbar-h) items-center rounded-full px-3 text-sm font-medium transition " +
              (f.active
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
            }
          >
            {f.label}
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

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Ad Soyad</th>
                <th className="oncelik-dusuk">Klinik / Bölge</th>
                <th className="oncelik-dusuk">Telefon</th>
                <th>Sorumlu Satıcı</th>
                <th className="sayi oncelik-dusuk">Sipariş</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz doktor kaydı yok." />
              )}
              {doctors.map((d) => (
                <tr key={d.id}>
                    <td>
                      {devirYetkisi && d.accountClass === "DOKTOR" && (
                        <label className="dokunma-hedefi">
                          <input
                            type="checkbox"
                            id={`sec-${d.id}`}
                            name="doctorId"
                            value={d.id}
                            form="toplu-devir"
                            aria-label={`${d.fullName} seç`}
                          />
                        </label>
                      )}
                    </td>
                    <td className="font-medium text-slate-900">
                      <Link
                        href={`/doctors/${d.id}`}
                        className="hover:underline"
                      >
                        {d.title ? `${d.title} ` : ""}
                        {d.fullName}
                      </Link>
                      {d.accountClass === "BAYI" && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Bayi</span>
                      )}
                    </td>
                    <td className="text-slate-500 oncelik-dusuk">
                      {d.clinic}
                      <span className="ml-1 text-xs text-slate-400">
                        {d.region}
                      </span>
                    </td>
                    <td className="tabular-nums text-slate-500 oncelik-dusuk">
                      {formatPhone(d.phoneNormalized)}
                    </td>
                    <td>
                      {d.accountClass === "BAYI" ? (
                        <span className="text-slate-400">—</span>
                      ) : d.ownerSeller ? (
                        <span className="text-slate-900">
                          {d.ownerSeller.name}
                        </span>
                      ) : (
                        <span className="font-medium text-critical">
                          Sahipsiz
                        </span>
                      )}
                    </td>
                    <td className="sayi oncelik-dusuk">
                      {d._count.orders}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={pageCount(total, perPage)}
        total={total}
        basePath="/doctors"
        params={{ sahip: params.sahip, sinif: params.sinif, fatura: params.fatura }}
      />
    </div>
  );
}
