"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { amountTLSchema } from "@/lib/validation";
import { getDueSettings, addDays } from "@/lib/settings";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { PaymentMethod } from "@/generated/prisma/enums";

export type CollectionState = { error?: string; ok?: string };

function parseMethod(v: FormDataEntryValue | null): PaymentMethod {
  const s = String(v ?? "");
  return s in PaymentMethod ? (s as PaymentMethod) : PaymentMethod.TRANSFER;
}

/**
 * 🔴 Tahsilat kaydı — sistemin MERKEZÎ olayı (RULE-12).
 *
 * Tahsilat kaydı yazılır; doktor bakiyesi hareketlerden HESAPLANIR (ayrı
 * kolon yok — RULE-08). Tahsilat hiçbir siparişle eşleştirilmez: FIFO mahsup
 * C3'te söküldü (GÇ-3, X-6), kongre kazanımı C2'de (GÇ-4).
 */
export async function recordCollection(
  _prev: CollectionState,
  formData: FormData
): Promise<CollectionState> {
  const session = await requireAdmin();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const amountTL = Number(formData.get("amount"));
  if (!doctorId) return { error: "Doktor seçiniz." };
  if (!amountTLSchema.safeParse(amountTL).success) {
    return { error: "Geçerli bir tahsilat tutarı giriniz." };
  }

  const amount = tlToKurus(amountTL);

  let paymentId = "";
  try {
    const payment = await prisma.doctorPayment.create({
      data: {
        doctorId,
        amount,
        method: parseMethod(formData.get("method")),
        paidAt: formData.get("paidAt")
          ? new Date(String(formData.get("paidAt")))
          : new Date(),
        referenceNo:
          ((formData.get("referenceNo") as string) || "").trim() || null,
        invoiceNo: ((formData.get("invoiceNo") as string) || "").trim() || null,
        note: ((formData.get("note") as string) || "").trim() || null,
        recordedBy: session.user.id,
      },
    });
    paymentId = payment.id;
  } catch {
    return { error: "Tahsilat kaydedilemedi." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COLLECTION_CREATE,
    entityType: "DoctorPayment",
    entityId: paymentId,
    after: { doctorId, amount },
  });

  revalidatePath("/collections");
  revalidatePath("/doctors");

  return { ok: "Tahsilat kaydedildi." };
}

/**
 * FR-29: Tahsilat iptali. Ters kayıt mantığı: tahsilat `IPTAL` işaretlenir;
 * bakiye hareketlerden hesaplandığı için kendiliğinden geri döner (RULE-08).
 */
export async function cancelCollection(
  _prev: CollectionState,
  formData: FormData
): Promise<CollectionState> {
  const session = await requireAdmin();
  const paymentId = (formData.get("paymentId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!paymentId) return { error: "Tahsilat seçilmedi." };

  const before = await prisma.doctorPayment.findUnique({
    where: { id: paymentId },
  });
  if (!before) return { error: "Tahsilat bulunamadı." };
  if (before.status === "IPTAL") return { error: "Bu tahsilat zaten iptal." };

  // Prim düzeltmesi (FR-35) C4'te söküldü — dönem kilidi yok (X-1 §(6)).
  await prisma.doctorPayment.update({
    where: { id: paymentId },
    data: {
      status: "IPTAL",
      cancelledAt: new Date(),
      cancelledBy: session.user.id,
      cancelReason: reason,
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COLLECTION_CANCEL,
    entityType: "DoctorPayment",
    entityId: paymentId,
    before,
    after: { status: "IPTAL", reason },
  });

  revalidatePath("/collections");
  revalidatePath("/doctors");
  return { ok: "Tahsilat iptal edildi." };
}

/**
 * FR-22 / D-02: Vade tarihi değiştirme. Her değişiklik geçmişe ve audit'e yazılır.
 * D-20: üst sınırı admin belirler — sınırsız uzatma YOKTUR.
 */
export async function changeDueDate(
  _prev: CollectionState,
  formData: FormData
): Promise<CollectionState> {
  const session = await requireAdmin();

  const orderId = (formData.get("orderId") as string)?.trim();
  const raw = (formData.get("newDueDate") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!orderId || !raw) return { error: "Sipariş ve yeni vade zorunludur." };

  const newDueDate = new Date(raw);
  if (Number.isNaN(newDueDate.getTime())) {
    return { error: "Geçerli bir tarih giriniz." };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Sipariş bulunamadı." };

  if (newDueDate < order.orderDate) {
    return { error: "Vade, sipariş tarihinden önce olamaz." };
  }

  // D-20: admin tarafından belirlenen üst sınır.
  const { maxDueDays } = await getDueSettings();
  const latestAllowed = addDays(order.orderDate, maxDueDays);
  if (newDueDate > latestAllowed) {
    return {
      error: `Vade, sipariş tarihinden en fazla ${maxDueDays} gün sonrası olabilir.`,
    };
  }

  const oldDueDate = order.dueDate;
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { dueDate: newDueDate } });
    await tx.dueDateChange.create({
      data: {
        orderId,
        oldDueDate,
        newDueDate,
        changedBy: session.user.id,
        reason,
      },
    });
  });

  // RULE-13: vade değişikliği istisnasız audit'e yazılır.
  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DUE_DATE_CHANGE,
    entityType: "Order",
    entityId: orderId,
    before: { dueDate: oldDueDate },
    after: { dueDate: newDueDate, reason },
  });

  revalidatePath("/orders");
  return { ok: "Vade güncellendi." };
}
