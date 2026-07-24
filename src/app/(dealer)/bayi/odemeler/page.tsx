import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
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

/** FR-46b: Bayi kendi ödeme geçmişini görür (READ-ONLY). */
export default async function DealerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const { dealer } = await requireDealerAccount();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  const where = { dealerId: dealer.id };
  const [payments, total] = await Promise.all([
    prisma.dealerPayment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip,
      take,
    }),
    prisma.dealerPayment.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Ödemelerim" description="Şirkete yaptığınız ödemeler" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Tarih</th>
                <th className="px-3 py-2 font-medium">Yöntem</th>
                <th className="px-3 py-2 font-medium">Referans</th>
                <th className="px-3 py-2 text-right font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <EmptyRow colSpan={4} text="Henüz ödeme kaydı yok." />
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(p.paidAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {p.referenceNo ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(p.amount)}
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
        basePath="/bayi/odemeler"
      />
    </div>
  );
}
