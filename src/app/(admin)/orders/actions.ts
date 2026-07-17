"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@/generated/prisma/enums";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

/** PENDING -> PREPARING */
export async function prepareOrder(id: string) {
  const session = await requireAdmin();
  const res = await prisma.order.updateMany({
    where: { id, status: "PENDING" },
    data: { status: OrderStatus.PREPARING },
  });
  if (res.count > 0) {
    await createAuditLog({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
      entityType: "Order",
      entityId: id,
      before: { status: "PENDING" },
      after: { status: "PREPARING" },
    });
  }
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** SHIPPED -> DELIVERED */
export async function markDelivered(id: string) {
  const session = await requireAdmin();
  let changed = 0;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: "SHIPPED" },
      data: { status: OrderStatus.DELIVERED },
    });
    changed = updated.count;
    if (updated.count > 0) {
      await tx.shipment.updateMany({
        where: { orderId: id },
        data: { status: OrderStatus.DELIVERED },
      });
    }
  });
  if (changed > 0) {
    await createAuditLog({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
      entityType: "Order",
      entityId: id,
      before: { status: "SHIPPED" },
      after: { status: "DELIVERED" },
    });
  }
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** Siparişi iptal eder ve stoğu geri yükler. */
export async function cancelOrder(id: string) {
  const session = await requireAdmin();

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

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.ORDER_CANCEL,
    entityType: "Order",
    entityId: id,
    before: { status: order.status },
    after: { status: "CANCELLED" },
  });

  revalidateOrders();
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect(`/orders/${id}`);
}
