import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { getAgingSummary } from "@/lib/doctor-cari";
import { AGING_LABELS, AGING_ORDER, agingBucket } from "@/lib/allocation";
import { weightedDiscount } from "@/lib/reports";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";

/**
 * FR-27: Satıcı panelinde KENDİ doktorlarının vadesi yaklaşan/geçen alacakları.
 *
 * BRK-01: Satıcı artık şirkete borçlu DEĞİL (D-01). Bu ekran eskiden satıcının
 * kendi borcunu gösteriyordu; artık tahsilat SORUMLULUĞUNU gösteriyor.
 */
export default async function AccountPage() {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const [orders, aging, doctorCount] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId, status: { not: "CANCELLED" } },
      orderBy: { dueDate: "asc" },
      include: {
        doctor: { select: { fullName: true } },
        allocations: {
          where: { payment: { status: "AKTIF" } },
          select: { amount: true },
        },
      },
    }),
    getAgingSummary({ sellerId }),
    prisma.doctor.count({ where: { ownerSellerId: sellerId } }),
  ]);

  // FR-61: ortalama iskonto (tutar ağırlıklı).
  const items = await prisma.orderItem.findMany({
    where: { order: { sellerId, status: { not: "CANCELLED" } } },
    select: { listPriceAtSale: true, netUnitPrice: true, quantity: true },
  });
  const ortalamaIskonto = weightedDiscount(items);

  const open = orders
    .map((o) => ({
      ...o,
      outstanding:
        o.grossTotal - o.allocations.reduce((s, a) => s + a.amount, 0n),
    }))
    .filter((o) => o.outstanding > 0n);

  const totalOpen = open.reduce((s, o) => s + o.outstanding, 0n);
  const overdue = open.filter((o) => agingBucket(o.dueDate) !== "NOT_DUE");
  const totalOverdue = overdue.reduce((s, o) => s + o.outstanding, 0n);

  return (
    <div>
      <PageHeader
        title="Hesabım"
        description="Sorumlu olduğunuz tahsilatlar ve portföy durumu"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doktor Sayısı" value={String(doctorCount)} />
        <StatCard label="Toplam Açık Alacak" value={formatTRY(totalOpen)} />
        <StatCard
          label="Vadesi Geçmiş"
          value={formatTRY(totalOverdue)}
          tone={totalOverdue > 0n ? "danger" : "success"}
          hint={`${overdue.length} sipariş`}
        />
        <StatCard label="Ortalama İskonto" value={`%${ortalamaIskonto}`} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {AGING_ORDER.map((b) => (
          <StatCard
            key={b}
            label={AGING_LABELS[b]}
            value={formatTRY(aging[b])}
            tone={b === "D90_PLUS" && aging[b] > 0n ? "danger" : "default"}
          />
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Açık Alacaklar (vadeye göre)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Vade</th>
                <th className="px-3 py-2 font-medium">Doktor</th>
                <th className="px-3 py-2 text-right font-medium">
                  Sipariş (KDV dahil)
                </th>
                <th className="px-3 py-2 text-right font-medium">Kalan</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {open.length === 0 && (
                <EmptyRow colSpan={6} text="Açık alacağınız yok." />
              )}
              {open.map((o) => {
                const bucket = agingBucket(o.dueDate);
                const late = bucket !== "NOT_DUE";
                return (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td
                      className={
                        "px-3 py-2 whitespace-nowrap " +
                        (late ? "font-medium text-red-600" : "text-slate-500")
                      }
                    >
                      {formatDate(o.dueDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {o.doctor.fullName}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {formatTRY(o.grossTotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatTRY(o.outstanding)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {AGING_LABELS[bucket]}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/my-orders/${o.id}`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
