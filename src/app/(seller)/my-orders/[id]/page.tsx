import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import OrderDetail from "@/components/OrderDetail";

export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSeller();

  const order = await prisma.order.findFirst({
    where: { id, sellerId: session.user.id },
    include: {
      doctor: true,
      items: { include: { product: { select: { name: true, code: true } } } },
      shipment: true,
    },
  });
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        title="Sipariş Detayı"
        action={
          <Link
            href="/my-orders"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Siparişlerim
          </Link>
        }
      />
      <OrderDetail order={order} />
    </div>
  );
}
