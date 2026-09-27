import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  Card,
  EmptyRow,
  PAYMENT_METHOD_LABELS,
} from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import CollectionForm from "./CollectionForm";
import CancelCollection from "./CancelCollection";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  await requireAdmin();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  const [doctors, payments, total] = await Promise.all([
    prisma.doctor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, clinic: true },
    }),
    prisma.doctorPayment.findMany({
      orderBy: { paidAt: "desc" },
      skip,
      take,
      include: {
        doctor: { select: { fullName: true } },
      },
    }),
    prisma.doctorPayment.count(),
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
            label: `${d.fullName} — ${d.clinic}`,
          }))}
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
                        {PAYMENT_METHOD_LABELS[p.method]}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.referenceNo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatTRY(p.amount)}
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
