import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { doctorScopeFor } from "@/lib/doctor";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const session = await requireSeller();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  // FR-05: satıcı yalnızca kendi portföyünü görür.
  const where = doctorScopeFor(session.user);

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip,
      take,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.doctor.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Doktorlarım"
        description="Portföyünüzdeki doktorlar"
        action={<LinkButton href="/my-doctors/new">Yeni Doktor</LinkButton>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Ad Soyad</th>
                <th className="px-4 py-2 font-medium">Klinik</th>
                <th className="px-4 py-2 font-medium">Bölge</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 text-right font-medium">Sipariş</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz doktor kaydınız yok." />
              )}
              {doctors.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {d.title ? `${d.title} ` : ""}
                    {d.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{d.clinic}</td>
                  <td className="px-4 py-3 text-slate-500">{d.region}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {formatPhone(d.phoneNormalized)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {d._count.orders}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/doctors/${d.id}/edit`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Düzenle
                    </Link>
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
        basePath="/my-doctors"
      />
    </div>
  );
}
