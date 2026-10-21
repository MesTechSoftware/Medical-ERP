import Link from "next/link";
import { prisma } from "@/lib/db";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { formatDate, formatDateTime } from "@/lib/format";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { shipOrder } from "./actions";
import { Tutar } from "@/components/Tutar";
import { SATIR_TABANI } from "@/lib/taban";
import { takipLinki } from "@/lib/kargo";
import { belgeOnayDurumlari } from "@/lib/onay-blogu";
import { OnayEtiketi } from "@/components/OnayEtiketi";

export default async function ShippingPage() {
  const [pending, shipped, carriers] = await Promise.all([
    prisma.order.findMany({
      where: { status: "HAZIRLANIYOR" },
      orderBy: { orderDate: "asc" },
      include: {
        seller: { select: { name: true } },
        doctor: { select: { fullName: true, clinic: true } },
        items: {
          orderBy: { id: "asc" },
          select: {
            ...SIPARIS_SATIRI,
            id: true,
            product: { select: { name: true, code: true } },
            shipmentItems: { select: { quantity: true } },
          },
        },
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
          include: { carrier: { select: { name: true, trackingUrlTemplate: true } } },
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
  // A-8: onay bekleyen ya da reddedilen sipariş sevk edilemez (negatif stok, bedelsiz satır).
  const onayDurumu = await belgeOnayDurumlari("SIP", pending.map((o) => o.id));

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
                    <span className="flex items-center gap-2 text-sm font-medium tabular-nums text-slate-900">
                      <OnayEtiketi durum={onayDurumu.get(o.id)} />
                      <Tutar deger={siparisToplami(o.items).toplam} taban={SATIR_TABANI.toplam} />
                    </span>
                  </div>
                  <IslemFormu
                    action={shipOrder.bind(null, o.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    {/* A-3: kısmi sevkiyat — her kalemin kalan miktarı varsayılandır; 0 bu sevkiyatta gönderilmez. */}
                    <div className="w-full space-y-1">
                      {o.items.map((i) => {
                        const kalan = i.quantity - i.shipmentItems.reduce((t, s) => t + s.quantity, 0);
                        return (
                          <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                            <label htmlFor={`miktar_${i.id}`} className="text-slate-700">
                              {i.product.name}
                              <span className="ml-1 text-xs text-slate-400">
                                {i.product.code} · kalan {kalan}/{i.quantity}
                              </span>
                            </label>
                            <input
                              id={`miktar_${i.id}`}
                              name={`miktar_${i.id}`}
                              type="number"
                              min={0}
                              max={kalan}
                              defaultValue={kalan}
                              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-slate-500"
                            />
                          </div>
                        );
                      })}
                    </div>
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
                    <div className="flex-1 min-w-[160px]">
                      <label htmlFor={`irsaliye_${o.id}`} className="mb-1 block text-xs text-slate-500">
                        İrsaliye No (isteğe bağlı)
                      </label>
                      <input
                        id={`irsaliye_${o.id}`}
                        name="externalDispatchNo"
                        maxLength={32}
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
                    {/* D-3: takip linki firmanın şablonundan; şablon yoksa yalnız numara. */}
                    {(() => {
                      const sv = o.shipments[0];
                      const link = takipLinki(sv?.carrier?.trackingUrlTemplate, sv?.trackingNumber);
                      return link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900">
                          {sv?.trackingNumber}
                        </a>
                      ) : (
                        (sv?.trackingNumber ?? "—")
                      );
                    })()}
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
