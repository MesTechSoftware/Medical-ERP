import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getDoctorCari, getAgingSummary } from "@/lib/doctor-cari";
import {
  AGING_LABELS,
  AGING_ORDER,
  agingBucket,
} from "@/lib/allocation";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
  PAYMENT_METHOD_LABELS,
} from "@/components/ui";

/**
 * FR-10: Doktor detayı — cari bakiye, vadesi gelen/geçen borç, sipariş ve
 * tahsilat geçmişi. Kongre defteri C2'de söküldü (GÇ-5).
 */
export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { ownerSeller: { select: { name: true } } },
  });
  if (!doctor) notFound();

  const [cari, aging, orders, payments] = await Promise.all([
    getDoctorCari(id),
    getAgingSummary({ doctorId: id }),
    prisma.order.findMany({
      where: { doctorId: id },
      orderBy: { orderDate: "desc" },
      take: 30,
      include: {
        seller: { select: { name: true } },
        allocations: {
          where: { payment: { status: "AKTIF" } },
          select: { amount: true },
        },
      },
    }),
    prisma.doctorPayment.findMany({
      where: { doctorId: id },
      orderBy: { paidAt: "desc" },
      take: 30,
    }),
  ]);

  const gecikmis = AGING_ORDER.filter((b) => b !== "NOT_DUE").reduce(
    (s, b) => s + aging[b],
    0n
  );

  return (
    <div>
      <PageHeader
        title={`${doctor.title ? `${doctor.title} ` : ""}${doctor.fullName}`}
        description={`${doctor.clinic} · ${doctor.region}${
          doctor.city ? ` · ${doctor.city}` : ""
        } · ${formatPhone(doctor.phoneNormalized)}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Sorumlu Satıcı"
          value={doctor.ownerSeller?.name ?? "Sahipsiz"}
          tone={doctor.ownerSeller ? "default" : "danger"}
        />
        <StatCard label="Toplam Sipariş" value={formatTRY(cari.toplamSiparis)} />
        <StatCard label="Toplam Tahsilat" value={formatTRY(cari.toplamTahsilat)} />
        <StatCard
          label="Cari Bakiye"
          value={formatTRY(cari.bakiye)}
          tone={cari.bakiye > 0n ? "danger" : "success"}
          hint={cari.bakiye > 0n ? "Şirkete borçlu" : "Bakiye kapalı"}
        />
        <StatCard
          label="Vadesi Geçmiş"
          value={formatTRY(gecikmis)}
          tone={gecikmis > 0n ? "danger" : "success"}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {AGING_ORDER.map((b) => (
          <StatCard key={b} label={AGING_LABELS[b]} value={formatTRY(aging[b])} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Sipariş Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Vade</th>
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 text-right font-medium">Kalan</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={5} text="Sipariş yok." />
                )}
                {orders.map((o) => {
                  const paid = o.allocations.reduce((s, a) => s + a.amount, 0n);
                  const rest = o.grossTotal - paid;
                  const late =
                    rest > 0n &&
                    o.status !== "CANCELLED" &&
                    agingBucket(o.dueDate) !== "NOT_DUE";
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
                      <td className="px-3 py-2 text-slate-500">
                        {o.seller.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatTRY(o.grossTotal)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {rest > 0n ? formatTRY(rest) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Tahsilat Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Yöntem</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={4} text="Tahsilat yok." />
                )}
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      "border-b border-slate-100 last:border-0 " +
                      (p.status === "IPTAL" ? "text-slate-400 line-through" : "")
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="px-3 py-2">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(p.amount)}
                    </td>
                    <td className="px-3 py-2">
                      {p.status === "IPTAL" ? "İptal" : "Aktif"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Link
          href="/doctors"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Doktor listesi
        </Link>
      </div>
    </div>
  );
}
