import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatla } from "@/lib/money";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getDoctorCari } from "@/lib/doctor-cari";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";

/**
 * FR-10: Doktor detayı — cari bakiye, sipariş ve tahsilat geçmişi.
 * Kongre defteri C2'de (GÇ-5), yaşlandırma ve vadesi geçmiş tutar C3'te
 * söküldü (GÇ-3, X-6 §(5)/(7)).
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

  const [cari, orders, payments] = await Promise.all([
    getDoctorCari(id),
    prisma.order.findMany({
      where: { doctorId: id },
      orderBy: { orderDate: "desc" },
      take: 30,
      include: {
        seller: { select: { name: true } },
        items: { select: SIPARIS_SATIRI },
      },
    }),
    prisma.doctorPayment.findMany({
      where: { doctorId: id },
      orderBy: { paidAt: "desc" },
      take: 30,
      include: { paymentMethod: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`${doctor.title ? `${doctor.title} ` : ""}${doctor.fullName}`}
        description={[doctor.clinic, doctor.region, doctor.city, formatPhone(doctor.phoneNormalized)]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sorumlu Satıcı"
          value={doctor.ownerSeller?.name ?? "Sahipsiz"}
          tone={doctor.ownerSeller ? "default" : "danger"}
        />
        {/* Cari hareketten okunur (X-11); CM → 1B arası boş görünür (FAZ1 R-11). */}
        <StatCard label="Toplam Borç" value={formatla(cari.toplamBorc)} />
        <StatCard label="Toplam Alacak" value={formatla(cari.toplamAlacak)} />
        <StatCard
          label="Cari Bakiye"
          value={formatla(cari.bakiye)}
          tone={cari.bakiye.gt(0) ? "danger" : "success"}
          hint={cari.bakiye.gt(0) ? "Şirkete borçlu" : "Bakiye kapalı"}
        />
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
                  <th className="px-3 py-2 font-medium">Belge No</th>
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow colSpan={5} text="Sipariş yok." />
                )}
                {orders.map((o) => {
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                        {o.documentNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                        {formatDate(o.orderDate)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {o.seller?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatla(siparisToplami(o.items).toplam)}
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
                      {p.paymentMethod.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatla(p.amount)}
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
