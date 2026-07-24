import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { OrderStatus } from "@/generated/prisma/enums";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tümü" },
  { value: "PENDING", label: "Bekliyor" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargolandı" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
];

function isOrderStatus(v: string): v is OrderStatus {
  return v in OrderStatus;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;
  const { status } = sp;
  const where =
    status && isOrderStatus(status) ? { status } : {};

  const { page, perPage, skip, take } = getPagination(sp);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      skip,
      take,
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Siparişler"
        description="Tüm satıcı siparişleri ve durum yönetimi"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/orders?status=${f.value}` : "/orders"}
              className={
                "rounded-full px-3 py-1 text-sm font-medium transition " +
                (active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Satıcı</th>
                <th className="px-4 py-2 font-medium">Doktor</th>
                <th className="px-4 py-2 font-medium">Hastane</th>
                <th className="px-4 py-2 text-right font-medium">Tutar</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow colSpan={7} text="Sipariş bulunamadı." />
              )}
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(o.orderDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{o.seller.name}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {o.doctor.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {o.doctor.clinic}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatTRY(o.grossTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/orders/${o.id}`}
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
        basePath="/orders"
        params={{ status }}
      />
    </div>
  );
}
