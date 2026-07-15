import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSellerCari } from "@/lib/cari";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
  PAYMENT_METHOD_LABELS,
} from "@/components/ui";

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await prisma.user.findFirst({ where: { id, role: "SELLER" } });
  if (!seller) notFound();

  const [cari, orders, payments] = await Promise.all([
    getSellerCari(id),
    prisma.order.findMany({
      where: { sellerId: id },
      orderBy: { orderDate: "desc" },
      take: 20,
    }),
    prisma.payment.findMany({
      where: { sellerId: id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={seller.name}
        description={`${seller.email}${seller.phone ? " · " + seller.phone : ""}`}
        action={
          <Link
            href={`/sellers/${id}/edit`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam Satış" value={formatTRY(cari.toplamSatis)} />
        <StatCard label="Toplam Ödeme" value={formatTRY(cari.toplamOdeme)} />
        <StatCard
          label="Güncel Bakiye"
          value={formatTRY(cari.guncelBakiye)}
          tone={cari.guncelBakiye > 0 ? "danger" : "default"}
          hint={cari.guncelBakiye > 0 ? "Şirkete borçlu" : "Bakiye kapalı"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Siparişler
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Doktor</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={4} text="Sipariş yok." />
                )}
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDate(o.orderDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">{o.doctorName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(o.totalAmount)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Ödemeler</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Yöntem</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={4} text="Ödeme yok." />
                )}
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDate(p.date)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(p.amount)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
