"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@/generated/prisma/enums";

/** PREPARING durumundaki siparişe kargo bilgisi girer ve SHIPPED yapar. */
export async function shipOrder(orderId: string, formData: FormData) {
  await requireAdmin();

  const carrier = ((formData.get("carrier") as string) || "").trim() || null;
  const trackingNumber =
    ((formData.get("trackingNumber") as string) || "").trim() || null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PREPARING") {
    redirect("/shipping");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SHIPPED },
    });
    await tx.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        carrier,
        trackingNumber,
        shippedAt: new Date(),
        status: OrderStatus.SHIPPED,
      },
      update: {
        carrier,
        trackingNumber,
        shippedAt: new Date(),
        status: OrderStatus.SHIPPED,
      },
    });
  });

  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/shipping");
}
