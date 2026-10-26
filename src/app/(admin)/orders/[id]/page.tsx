import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import OrderDetail from "@/components/OrderDetail";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IslemFormu } from "@/components/Sonuc";
import { prepareOrder, markDelivered, cancelOrder, createReturn } from "../actions";
import IadeFormu from "./IadeFormu";
import { formatDateTime } from "@/lib/format";
import { buton } from "@/components/stil";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller: { select: { name: true } },
      doctor: true,
      items: {
        include: {
          product: { select: { name: true, code: true } },
          shipmentItems: { select: { quantity: true } },
          returnItems: { select: { quantity: true } },
        },
      },
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { carrier: { select: { name: true } } },
      },
    },
  });
  if (!order) notFound();

  // A-1: iade edilebilir = sevk edilen − önceki iadeler.
  const iadeKalemleri = order.items
    .map((i) => ({
      id: i.id,
      urun: i.product.name,
      kod: i.product.code,
      iadeEdilebilir:
        i.shipmentItems.reduce((t, s) => t + s.quantity, 0) - i.returnItems.reduce((t, r) => t + r.quantity, 0),
    }))
    .filter((k) => k.iadeEdilebilir > 0);
  const iadeler = await prisma.returnNote.findMany({
    where: { items: { some: { orderItem: { orderId: id } } } },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { orderItem: { select: { product: { select: { name: true } } } } } } },
  });

  const canCancel =
    order.status !== "IPTAL" && order.status !== "TESLIM_EDILDI";

  return (
    <div>
      <PageHeader
        title="Sipariş Detayı"
        action={
          <Link
            href="/orders"
            className={buton("metin")}
          >
            ← Siparişler
          </Link>
        }
      />

      <OrderDetail order={{ ...order, shipment: order.shipments[0] ?? null }} showSeller />

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">İşlemler</h2>
        <div className="flex flex-wrap items-center gap-3">
          {order.status === "BEKLIYOR" && (
            <IslemFormu action={prepareOrder.bind(null, id)}>
              <button
                type="submit"
                className={buton("birincil")}
              >
                Hazırlığa Al
              </button>
            </IslemFormu>
          )}

          {order.status === "HAZIRLANIYOR" && (
            <Link
              href="/shipping"
              className={buton("birincil")}
            >
              Kargo Bilgisi Gir
            </Link>
          )}

          {order.status === "KARGOLANDI" && (
            <IslemFormu action={markDelivered.bind(null, id)}>
              <button
                type="submit"
                className={buton("olumlu")}
              >
                Teslim Edildi Olarak İşaretle
              </button>
            </IslemFormu>
          )}

          {canCancel && (
            <IslemFormu action={cancelOrder.bind(null, id)}>
              <ConfirmSubmit
                confirmText="Sipariş iptal edilecek ve stok geri yüklenecek. Onaylıyor musunuz?"
                className={buton("olumsuz-cerceve")}
              >
                Siparişi İptal Et
              </ConfirmSubmit>
            </IslemFormu>
          )}

          {(order.status === "TESLIM_EDILDI" || order.status === "IPTAL") && (
            <p className="text-sm text-slate-400">
              Bu sipariş için işlem bulunmuyor.
            </p>
          )}
        </div>
      </Card>

      {(iadeKalemleri.length > 0 || iadeler.length > 0) && (
        <div className="mt-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">İade</h2>
            {iadeler.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-slate-700">
                {iadeler.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.documentNo}</span>
                    <span className="ml-2 text-slate-500">{formatDateTime(r.createdAt)}</span>
                    {" · "}
                    {r.items.map((i) => `${i.orderItem.product.name} × ${i.quantity}`).join(", ")}
                    <span className="ml-2 text-slate-500">— {r.reason}</span>
                  </li>
                ))}
              </ul>
            )}
            {iadeKalemleri.length > 0 && <IadeFormu action={createReturn.bind(null, id)} kalemler={iadeKalemleri} />}
          </Card>
        </div>
      )}
    </div>
  );
}
