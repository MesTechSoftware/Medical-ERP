"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@/generated/prisma/enums";
import { stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

/** BEKLIYOR -> HAZIRLANIYOR */
export async function prepareOrder(id: string) {
  const session = await requireStaff();
  await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id, status: "BEKLIYOR" },
      data: { status: OrderStatus.HAZIRLANIYOR },
    });
    if (res.count > 0) {
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
          entityType: "Order",
          entityId: id,
          before: { status: "BEKLIYOR" },
          after: { status: "HAZIRLANIYOR" },
        },
        tx
      );
    }
  });
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** KARGOLANDI -> TESLIM_EDILDI */
export async function markDelivered(id: string) {
  const session = await requireStaff();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: "KARGOLANDI" },
      data: { status: OrderStatus.TESLIM_EDILDI },
    });
    if (updated.count > 0) {
      await tx.shipment.updateMany({
        where: { orderId: id },
        data: { status: OrderStatus.TESLIM_EDILDI },
      });
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
          entityType: "Order",
          entityId: id,
          before: { status: "KARGOLANDI" },
          after: { status: "TESLIM_EDILDI" },
        },
        tx
      );
    }
  });
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** Siparişi iptal eder ve stoğu geri yükler. */
export async function cancelOrder(id: string) {
  const session = await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) redirect("/orders");
  if (order.status === "IPTAL" || order.status === "TESLIM_EDILDI") {
    redirect(`/orders/${id}?error=cannotCancel`);
  }

  await prisma.$transaction(async (tx) => {
    // Stok iadesi = GIRIS hareketleri (stok miktarı saklanmaz — ADR-005).
    const locationId = await varsayilanDepoId(tx);
    await stokHareketiYaz(
      tx,
      order.items.map((item) => ({
        productId: item.productId,
        locationId,
        type: "GIRIS" as const,
        quantity: item.quantity,
        note: "Sipariş iptali - stok iadesi",
        orderId: order.id,
      }))
    );
    await tx.order.update({
      where: { id },
      data: { status: OrderStatus.IPTAL },
    });
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.ORDER_CANCEL,
        entityType: "Order",
        entityId: id,
        before: { status: order.status },
        after: { status: "IPTAL" },
      },
      tx
    );
  });

  revalidateOrders();
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect(`/orders/${id}`);
}
