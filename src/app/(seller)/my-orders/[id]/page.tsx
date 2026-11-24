import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import OrderDetail from "@/components/OrderDetail";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

export const metadata: Metadata = { title: "Sipariş Detayı" };

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
      items: {
        include: {
          product: { select: { name: true, code: true } },
          shipmentItems: { select: { quantity: true } },
        },
      },
      shipments: {
        orderBy: { createdAt: "asc" },
        include: { carrier: { select: { name: true, trackingUrlTemplate: true } } },
      },
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
            className={buton("metin")}
          >
            <Ikon ad="geri" />
            Siparişlerim
          </Link>
        }
      />
      <OrderDetail order={order} />
    </div>
  );
}
