"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { amountTLSchema } from "@/lib/validation";
import { allocateFIFO } from "@/lib/allocation";
import { getOpenOrders } from "@/lib/doctor-cari";
import { getDueSettings, addDays } from "@/lib/settings";
import { queueCancellationAdjustments } from "@/lib/commission-service";
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
 * Tek transaction içinde:
 *   (a) tahsilat kaydı yazılır,
 *   (b) FIFO mahsuplaşma yapılır (D-18),
 *   (c) doktor bakiyesi bunlardan HESAPLANIR (ayrı kolon yok — RULE-08).
 * Kongre kazanımı C2'de söküldü (GÇ-4).
 *
 * Herhangi bir adım hata verirse hiçbiri yazılmaz.
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
  const openOrders = await getOpenOrders(doctorId);

  // FIFO: vadesi en eski siparişten başlayarak mahsup (D-18).
  const { allocations, unallocated } = allocateFIFO(amount, openOrders);

  let paymentId = "";
  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const payment = await tx.doctorPayment.create({
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

      if (allocations.length > 0) {
        await tx.paymentAllocation.createMany({
          data: allocations.map((a) => ({
            paymentId: payment.id,
            orderId: a.orderId,
            amount: a.amount,
          })),
        });
      }

      return payment.id;
    });
  } catch {
    return { error: "Tahsilat kaydedilemedi." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COLLECTION_CREATE,
    entityType: "DoctorPayment",
    entityId: paymentId,
    after: { doctorId, amount, allocations, unallocated },
  });

  revalidatePath("/collections");
  revalidatePath("/doctors");

  return {
    ok:
      unallocated > 0n
        ? "Tahsilat kaydedildi. Açık borcu aşan kısım avans olarak kaldı."
        : "Tahsilat kaydedildi ve siparişlere mahsup edildi.",
  };
}

/**
 * FR-29: Tahsilat iptali. Ters kayıt mantığı: tahsilat `IPTAL` işaretlenir ve
 * mahsupları silinir — böylece bakiye ve yaşlandırma otomatik geri döner
 * (bakiye hareketlerden hesaplandığı için ayrı düzeltme gerekmez, RULE-08).
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
    include: { allocations: true },
  });
  if (!before) return { error: "Tahsilat bulunamadı." };
  if (before.status === "IPTAL") return { error: "Bu tahsilat zaten iptal." };

  await prisma.$transaction(async (tx) => {
    // FR-35 / RULE-05: kapanmış döneme ait iptal, matrah düzeltmesi olarak
    // SONRAKİ döneme yazılır. Mahsuplar silinmeden ÖNCE hesaplanmalı.
    await queueCancellationAdjustments(tx, before, session.user.id);

    await tx.paymentAllocation.deleteMany({ where: { paymentId } });
    await tx.doctorPayment.update({
      where: { id: paymentId },
      data: {
        status: "IPTAL",
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
        cancelReason: reason,
      },
    });
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
  return { ok: "Tahsilat iptal edildi; mahsuplar geri alındı." };
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
