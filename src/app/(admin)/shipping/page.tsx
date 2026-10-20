import Link from "next/link";
import { prisma } from "@/lib/db";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate, formatDateTime } from "@/lib/format";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { shipOrder } from "./actions";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI } from "@/lib/taban";

export default async function ShippingPage() {
  const [pending, shipped, carriers] = await Promise.all([
    prisma.order.findMany({
      where: { status: "HAZIRLANIYOR" },
      orderBy: { orderDate: "asc" },
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        items: { select: SIPARIS_SATIRI },
      },
    }),
    prisma.order.findMany({
      where: { status: { in: ["KARGOLANDI", "TESLIM_EDILDI"] } },
      orderBy: { orderDate: "desc" },
      take: 30,
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { carrier: { select: { name: true } } },
        },
      },
    }),
    // Kargo firması tanım tablosudur (D-3); yönetim ekranı 1B'dedir.
    prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
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
                        {[o.doctor.clinic, o.seller?.name].filter(Boolean).join(" · ")} ·{" "}
                        {formatDate(o.orderDate)}
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-slate-900">
                      <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} />
                    </span>
                  </div>
                  <IslemFormu
                    action={shipOrder.bind(null, o.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <div className="flex-1 min-w-[160px]">
                      <label className="mb-1 block text-xs text-slate-500">
                        Kargo Firması
                      </label>
                      <select
                        name="carrierId"
                        defaultValue=""
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        <option value="">Seçiniz...</option>
                        {carriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
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
                  </IslemFormu>
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
                  <td className="px-4 py-3 text-slate-500">{o.seller?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.shipments[0]?.carrier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {o.shipments[0]?.trackingNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {o.shipments[0]?.shippedAt
                      ? formatDateTime(o.shipments[0].shippedAt)
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
