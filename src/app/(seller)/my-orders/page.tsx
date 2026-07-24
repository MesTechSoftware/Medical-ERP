import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const session = await requireSeller();
  const { page, perPage, skip, take } = getPagination(await searchParams);
  const where = { sellerId: session.user.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      skip,
      take,
      include: {
        _count: { select: { items: true } },
        doctor: { select: { fullName: true, clinic: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Siparişlerim"
        description="Oluşturduğunuz siparişler"
        action={<LinkButton href="/my-orders/new">Yeni Sipariş</LinkButton>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Doktor</th>
                <th className="px-4 py-2 font-medium">Hastane</th>
                <th className="px-4 py-2 text-right font-medium">Kalem</th>
                <th className="px-4 py-2 text-right font-medium">Tutar</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz sipariş oluşturmadınız." />
              )}
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(o.orderDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {o.doctor.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.doctor.clinic}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {o._count.items}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatTRY(o.grossTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/my-orders/${o.id}`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Detay
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
        basePath="/my-orders"
      />
    </div>
  );
}
