import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import OrderDetail from "@/components/OrderDetail";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { prepareOrder, markDelivered, cancelOrder } from "../actions";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller: { select: { name: true } },
      doctor: true,
      items: { include: { product: { select: { name: true, code: true } } } },
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { carrier: { select: { name: true } } },
      },
    },
  });
  if (!order) notFound();

  const canCancel =
    order.status !== "IPTAL" && order.status !== "TESLIM_EDILDI";

  return (
    <div>
      <PageHeader
        title="Sipariş Detayı"
        action={
          <Link
            href="/orders"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Siparişler
          </Link>
        }
      />

      {error === "cannotCancel" && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Teslim edilmiş veya zaten iptal edilmiş sipariş iptal edilemez.
        </div>
      )}

      <OrderDetail order={{ ...order, shipment: order.shipments[0] ?? null }} showSeller />

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">İşlemler</h2>
        <div className="flex flex-wrap items-center gap-3">
          {order.status === "BEKLIYOR" && (
            <form action={prepareOrder.bind(null, id)}>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Hazırlığa Al
              </button>
            </form>
          )}

          {order.status === "HAZIRLANIYOR" && (
            <Link
              href="/shipping"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Kargo Bilgisi Gir
            </Link>
          )}

          {order.status === "KARGOLANDI" && (
            <form action={markDelivered.bind(null, id)}>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Teslim Edildi Olarak İşaretle
              </button>
            </form>
          )}

          {canCancel && (
            <form action={cancelOrder.bind(null, id)}>
              <ConfirmSubmit
                confirmText="Sipariş iptal edilecek ve stok geri yüklenecek. Onaylıyor musunuz?"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Siparişi İptal Et
              </ConfirmSubmit>
            </form>
          )}

          {(order.status === "TESLIM_EDILDI" || order.status === "IPTAL") && (
            <p className="text-sm text-slate-400">
              Bu sipariş için işlem bulunmuyor.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
