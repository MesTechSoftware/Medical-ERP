"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
import { buildShipment } from "@/lib/dealer-shipment";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type RequestState = { error?: string; ok?: string };

/**
 * FR-46d: Bayi sevkiyat TALEBİ oluşturur.
 *
 * 🔴 TALEP aşamasında stok DÜŞMEZ, cariye YAZILMAZ — yalnızca kayıt oluşur.
 * Etki admin onayında (approveShipment) olur. Bayi doğrudan sipariş veremez.
 *
 * dealerId İSTEMCİDEN ALINMAZ: oturumdaki bayiden gelir (FR-46a/FR-46f).
 */
export async function requestShipment(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const { dealer, session } = await requireDealerAccount();

  let raw: unknown;
  try {
    raw = JSON.parse((formData.get("items") as string) || "[]");
  } catch {
    return { error: "Talep kalemleri okunamadı." };
  }
  const lines = Array.isArray(raw)
    ? raw
        .map((l) => ({ productId: String(l.productId), quantity: Number(l.quantity) }))
        .filter((l) => l.productId && l.quantity > 0)
    : [];
  if (lines.length === 0) return { error: "En az bir ürün ve miktar giriniz." };

  let shipmentId = "";
  try {
    // Fiyatlar bayinin kendi listesinden gelir (RULE-06); stok kontrolü YOK
    // (talep aşamasında stok düşmez — onayda kontrol edilir).
    const built = await buildShipment(dealer.id, lines);
    const shipment = await prisma.dealerShipment.create({
      data: {
        dealerId: dealer.id,
        status: "TALEP",
        requestedByUserId: session.user.id,
        netTotal: built.netTotal,
        vatTotal: built.vatTotal,
        grossTotal: built.grossTotal,
        items: { create: built.items },
      },
    });
    shipmentId = shipment.id;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Talep oluşturulamadı.",
    };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_SHIPMENT_REQUEST,
    entityType: "DealerShipment",
    entityId: shipmentId,
    after: { dealerId: dealer.id, lineCount: lines.length },
  });

  revalidatePath("/bayi/sevkiyatlar");
  revalidatePath("/bayi");
  return { ok: "Sevkiyat talebiniz oluşturuldu; yönetici onayına düştü." };
}

/** Bayi kendi ONAYLANMAMIŞ talebini geri çeker (FR-46e). */
export async function withdrawRequest(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const { dealer, session } = await requireDealerAccount();
  const shipmentId = (formData.get("shipmentId") as string)?.trim();
  if (!shipmentId) return { error: "Talep seçilmedi." };

  // 🔴 Yalnızca KENDİ talebini ve yalnızca TALEP durumundakini geri çekebilir.
  const shipment = await prisma.dealerShipment.findUnique({
    where: { id: shipmentId },
  });
  if (!shipment || shipment.dealerId !== dealer.id) {
    return { error: "Talep bulunamadı." };
  }
  if (shipment.status !== "TALEP") {
    return { error: "Yalnızca onaylanmamış talep geri çekilebilir." };
  }

  await prisma.dealerShipment.update({
    where: { id: shipmentId },
    data: {
      status: "REDDEDILDI",
      cancelReason: "Bayi tarafından geri çekildi",
      cancelledAt: new Date(),
      cancelledBy: session.user.id,
    },
  });

  revalidatePath("/bayi/sevkiyatlar");
  return { ok: "Talep geri çekildi." };
}
