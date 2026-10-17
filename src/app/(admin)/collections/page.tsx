import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { formatla } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import CollectionForm from "./CollectionForm";
import CancelCollection from "./CancelCollection";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  await requireStaff();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  const [doctors, payments, total, paymentMethods] = await Promise.all([
    prisma.doctor.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, clinic: true },
    }),
    prisma.doctorPayment.findMany({
      orderBy: { paidAt: "desc" },
      skip,
      take,
      include: {
        doctor: { select: { fullName: true } },
        paymentMethod: { select: { name: true } },
      },
    }),
    prisma.doctorPayment.count(),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Tahsilatlar"
        description="Doktorlardan yapılan tahsilatlar"
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Yeni Tahsilat
        </h2>
        <CollectionForm
          doctors={doctors.map((d) => ({
            id: d.id,
            label: d.clinic ? `${d.fullName} — ${d.clinic}` : d.fullName,
          }))}
          paymentMethods={paymentMethods}
        />
      </Card>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Tahsilat Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Doktor</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 font-medium">Referans</th>
                  <th className="px-4 py-2 text-right font-medium">Tutar</th>
                  <th className="px-4 py-2 font-medium">Durum</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={7} text="Henüz tahsilat kaydı yok." />
                )}
                {payments.map((p) => {
                  const cancelled = p.status === "IPTAL";
                  return (
                    <tr
                      key={p.id}
                      className={
                        "border-b border-slate-100 last:border-0 " +
                        (cancelled ? "text-slate-400 line-through" : "")
                      }
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(p.paidAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {p.doctor.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.paymentMethod.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.referenceNo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatla(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {cancelled ? "İptal" : "Aktif"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!cancelled && <CancelCollection paymentId={p.id} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Pagination
        page={page}
        totalPages={pageCount(total, perPage)}
        total={total}
        basePath="/collections"
      />
    </div>
  );
}
