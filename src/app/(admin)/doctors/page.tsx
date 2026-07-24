import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import TransferForm from "./TransferForm";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  await requireAdmin();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  // FR-05: admin TÜM doktorları görür.
  const [doctors, total, sellers] = await Promise.all([
    prisma.doctor.findMany({
      orderBy: { fullName: "asc" },
      skip,
      take,
      include: {
        ownerSeller: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.doctor.count(),
    prisma.user.findMany({
      where: { role: "SELLER", status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const unowned = doctors.filter((d) => d.ownerSellerId === null).length;

  return (
    <div>
      <PageHeader
        title="Doktorlar"
        description="Tüm doktor portföyü ve satıcı devirleri"
      />

      {unowned > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{unowned}</strong> doktor sahipsiz havuzda. Bir satıcıya
          atanana kadar bu doktorlara sipariş girilemez.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Ad Soyad</th>
                <th className="px-4 py-2 font-medium">Klinik / Bölge</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Sorumlu Satıcı</th>
                <th className="px-4 py-2 text-right font-medium">Sipariş</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz doktor kaydı yok." />
              )}
              {doctors.map((d) => (
                <Fragment key={d.id}>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/doctors/${d.id}`}
                        className="hover:underline"
                      >
                        {d.title ? `${d.title} ` : ""}
                        {d.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {d.clinic}
                      <span className="ml-1 text-xs text-slate-400">
                        {d.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">
                      {formatPhone(d.phoneNormalized)}
                    </td>
                    <td className="px-4 py-3">
                      {d.ownerSeller ? (
                        <span className="text-slate-900">
                          {d.ownerSeller.name}
                        </span>
                      ) : (
                        <span className="font-medium text-amber-700">
                          Sahipsiz
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d._count.orders}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 last:border-0">
                    <td colSpan={6} className="bg-slate-50/60 px-4 py-2">
                      <TransferForm
                        doctorId={d.id}
                        currentSellerId={d.ownerSellerId}
                        sellers={sellers}
                      />
                    </td>
                  </tr>
                </Fragment>
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
      />
    </div>
  );
}
