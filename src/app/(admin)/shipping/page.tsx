import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import { shipOrder } from "./actions";

export default async function ShippingPage() {
  const [pending, shipped] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PREPARING" },
      orderBy: { orderDate: "asc" },
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
      },
    }),
    prisma.order.findMany({
      where: { status: { in: ["SHIPPED", "DELIVERED"] } },
      orderBy: { orderDate: "desc" },
      take: 30,
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        shipment: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Kargo"
        description="Hazırlanan siparişleri kargoya verin"
      />

      <div className="mb-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kargo Bekleyenler ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Kargo bekleyen sipariş yok.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {o.doctor.fullName}
                      </Link>
                      <span className="ml-2 text-sm text-slate-500">
                        {o.doctor.clinic} · {o.seller.name} ·{" "}
                        {formatDate(o.orderDate)}
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-slate-900">
                      {formatTRY(o.grossTotal)}
                    </span>
                  </div>
                  <form
                    action={shipOrder.bind(null, o.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <div className="flex-1 min-w-[160px]">
                      <label className="mb-1 block text-xs text-slate-500">
                        Kargo Firması
                      </label>
                      <input
                        name="carrier"
                        placeholder="Örn: Aras Kargo"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="mb-1 block text-xs text-slate-500">
                        Takip Numarası
                      </label>
                      <input
                        name="trackingNumber"
                        placeholder="Örn: TR123456789"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Kargola
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Kargolanan Siparişler
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Doktor</th>
                <th className="px-4 py-2 font-medium">Satıcı</th>
                <th className="px-4 py-2 font-medium">Kargo</th>
                <th className="px-4 py-2 font-medium">Takip No</th>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {shipped.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz kargolanan sipariş yok." />
              )}
              {shipped.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {o.doctor.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.seller.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.shipment?.carrier ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.shipment?.trackingNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {o.shipment?.shippedAt
                      ? formatDateTime(o.shipment.shippedAt)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
