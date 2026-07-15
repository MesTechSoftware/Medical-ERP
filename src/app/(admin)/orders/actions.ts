"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@/generated/prisma/enums";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

/** PENDING -> PREPARING */
export async function prepareOrder(id: string) {
  await requireAdmin();
  await prisma.order.updateMany({
    where: { id, status: "PENDING" },
    data: { status: OrderStatus.PREPARING },
  });
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** SHIPPED -> DELIVERED */
export async function markDelivered(id: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: "SHIPPED" },
      data: { status: OrderStatus.DELIVERED },
    });
    if (updated.count > 0) {
      await tx.shipment.updateMany({
        where: { orderId: id },
        data: { status: OrderStatus.DELIVERED },
      });
    }
  });
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** Siparişi iptal eder ve stoğu geri yükler. */
export async function cancelOrder(id: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) redirect("/orders");
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    redirect(`/orders/${id}?error=cannotCancel`);
  }

  await prisma.$transaction(async (tx) => {
    // Stok iadesi + IN hareketleri
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "IN",
          quantity: item.quantity,
          note: "Sipariş iptali - stok iadesi",
          orderId: order.id,
        },
      });
    }
    await tx.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  });

  revalidateOrders();
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect(`/orders/${id}`);
}
