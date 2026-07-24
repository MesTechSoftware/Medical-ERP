import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAgingSummary } from "@/lib/doctor-cari";
import { AGING_LABELS, AGING_ORDER } from "@/lib/allocation";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await prisma.user.findFirst({ where: { id, role: "SELLER" } });
  if (!seller) notFound();

  const [aging, orders, doctors] = await Promise.all([
    getAgingSummary({ sellerId: id }),
    prisma.order.findMany({
      where: { sellerId: id },
      orderBy: { orderDate: "desc" },
      take: 20,
      include: { doctor: { select: { fullName: true } } },
    }),
    prisma.doctor.findMany({
      where: { ownerSellerId: id },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, clinic: true, region: true },
    }),
  ]);

  const acikAlacak = AGING_ORDER.reduce((s, b) => s + aging[b], 0n);
  const gecikmis = acikAlacak - aging.NOT_DUE;

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

      {/* D-01: satıcı borçlu DEĞİL; bunlar doktorların şirkete borcudur. */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Doktor Sayısı" value={String(doctors.length)} />
        <StatCard label="Açık Alacak" value={formatTRY(acikAlacak)} />
        <StatCard
          label="Vadesi Geçmiş"
          value={formatTRY(gecikmis)}
          tone={gecikmis > 0n ? "danger" : "success"}
          hint="Tahsilat sorumluluğu"
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {AGING_ORDER.map((b) => (
          <StatCard key={b} label={AGING_LABELS[b]} value={formatTRY(aging[b])} />
        ))}
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
                    <td className="px-3 py-2 text-slate-900">{o.doctor.fullName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(o.grossTotal)}
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Doktor Portföyü
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Doktor</th>
                  <th className="px-3 py-2 font-medium">Klinik</th>
                  <th className="px-3 py-2 font-medium">Bölge</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 && (
                  <EmptyRow colSpan={3} text="Portföyde doktor yok." />
                )}
                {doctors.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 text-slate-900">{d.fullName}</td>
                    <td className="px-3 py-2 text-slate-500">{d.clinic}</td>
                    <td className="px-3 py-2 text-slate-500">{d.region}</td>
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
