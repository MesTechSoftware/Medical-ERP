"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@/generated/prisma/enums";
import { uretBelgeNo } from "@/lib/belge-no";
import { bugun, simdi } from "@/lib/zaman";

/**
 * HAZIRLANIYOR durumundaki siparişe kargo bilgisi girer ve KARGOLANDI yapar.
 * Sevkiyat satırı, kısmi sevkiyat ve sevkiyatta doğan borç 1B madde 7'dedir (A-3, GÇ-12);
 * `CM`'de sevkiyat bugünkü gibi siparişin tamamıdır ve yalnız başlık yazar.
 */
export async function shipOrder(orderId: string, formData: FormData) {
  const session = await requireStaff();

  const carrierId = ((formData.get("carrierId") as string) || "").trim() || null;
  const trackingNumber =
    ((formData.get("trackingNumber") as string) || "").trim() || null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "HAZIRLANIYOR") {
    redirect("/shipping");
  }

  let documentNo = "";
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.KARGOLANDI },
    });
    documentNo = await uretBelgeNo("SVK", tx);
    await tx.shipment.create({
      data: {
        documentNo,
        orderId,
        carrierId,
        trackingNumber,
        shippedOn: bugun(),
        shippedAt: simdi(),
        status: OrderStatus.KARGOLANDI,
      },
    });
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
    entityType: "Order",
    entityId: orderId,
    before: { status: "HAZIRLANIYOR" },
    after: { status: "KARGOLANDI", documentNo, carrierId, trackingNumber },
  });

  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  redirect("/shipping");
}
