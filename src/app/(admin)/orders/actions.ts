"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@/generated/prisma/enums";
import { stokHareketiYaz, stokKilitle } from "@/lib/stok";
import { engel, type IslemSonucu } from "@/lib/sonuc";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

// Durum geçişi koşullu yazılır; arada durum değiştiyse (başka kullanıcı ilerletti) işlem
// sessizce geçmez, `SIPARIS_DURUMU_UYGUN_DEGIL` döner (X-4 §(7)).

/** BEKLIYOR -> HAZIRLANIYOR */
export async function prepareOrder(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();
  const res = await prisma.$transaction(async (tx) => {
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
    return res;
  });
  if (res.count === 0) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** KARGOLANDI -> TESLIM_EDILDI */
export async function markDelivered(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();
  const updated = await prisma.$transaction(async (tx) => {
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
    return updated;
  });
  if (updated.count === 0) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/**
 * Siparişi iptal eder. Sevk edilmiş sipariş bu yoldan iptal edilemez — o iade sürecidir (K-1, A-1).
 * Stok sevkiyatta düşer (A-3); sevk edilmemiş siparişin stok hareketi yoktur. Eski akışta sipariş
 * anında yazılmış çıkış varsa (1B-7 öncesi kayıtlar) iade girişiyle geri alınır.
 */
export async function cancelOrder(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, items: { select: { productId: true } } },
  });
  if (!order) redirect("/orders");

  const iptalEdildi = await prisma.$transaction(async (tx) => {
    // Sevkiyatın kilitlediği ürün satırları kilitlenir (ADR-008 sırası): eşzamanlı sevkiyat varsa
    // iptal onun commit'ini bekler ve koşullu yazım sevkiyatı görür.
    await stokKilitle(tx, order.items.map((i) => i.productId));
    const res = await tx.order.updateMany({
      where: { id, status: { in: ["BEKLIYOR", "HAZIRLANIYOR"] }, shipments: { none: {} } },
      data: { status: OrderStatus.IPTAL },
    });
    if (res.count === 0) return false;
    const eskiCikislar = await tx.stockMovement.findMany({
      where: { orderId: id, type: "CIKIS" },
      select: { productId: true, locationId: true, quantity: true },
    });
    if (eskiCikislar.length > 0) {
      await stokHareketiYaz(
        tx,
        eskiCikislar.map((h) => ({ ...h, type: "GIRIS" as const, note: "Sipariş iptali - stok iadesi", orderId: id }))
      );
    }
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
    return true;
  });
  if (!iptalEdildi) return engel("SIPARIS_IPTAL_EDILEMEZ");

  revalidateOrders();
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect(`/orders/${id}`);
}
