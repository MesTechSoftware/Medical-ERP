import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

/**
 * Sipariş durum geçişleri — ekran ve demo geçmiş seed'inin ortak yolu. Geçiş koşullu yazılır;
 * arada durum değiştiyse (başka kullanıcı ilerletti) `false` döner ve hiçbir şey yazılmaz, çağıran
 * `SIPARIS_DURUMU_UYGUN_DEGIL` bildirir (X-4 §(7)).
 */

/** BEKLIYOR -> HAZIRLANIYOR; yalnız onaylı sipariş (teklif hazırlanamaz, A-5-10). */
export async function siparisiHazirla(tx: Prisma.TransactionClient, g: { siparisId: string; yapanId: string }): Promise<boolean> {
  const res = await tx.order.updateMany({
    where: { id: g.siparisId, status: "BEKLIYOR", stage: "ONAYLI" },
    data: { status: OrderStatus.HAZIRLANIYOR },
  });
  if (res.count === 0) return false;
  await createAuditLog(
    {
      actorId: g.yapanId,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
      entityType: "Order",
      entityId: g.siparisId,
      before: { status: "BEKLIYOR" },
      after: { status: "HAZIRLANIYOR" },
    },
    tx
  );
  return true;
}

/** KARGOLANDI -> TESLIM_EDILDI; siparişin sevkiyatları da teslim edildi olur. */
export async function teslimEdildiIsaretle(tx: Prisma.TransactionClient, g: { siparisId: string; yapanId: string }): Promise<boolean> {
  const res = await tx.order.updateMany({
    where: { id: g.siparisId, status: "KARGOLANDI" },
    data: { status: OrderStatus.TESLIM_EDILDI },
  });
  if (res.count === 0) return false;
  await tx.shipment.updateMany({
    where: { orderId: g.siparisId },
    data: { status: OrderStatus.TESLIM_EDILDI },
  });
  await createAuditLog(
    {
      actorId: g.yapanId,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
      entityType: "Order",
      entityId: g.siparisId,
      before: { status: "KARGOLANDI" },
      after: { status: "TESLIM_EDILDI" },
    },
    tx
  );
  return true;
}
