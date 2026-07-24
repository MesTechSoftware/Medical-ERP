"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { priceTLSchema, amountTLSchema } from "@/lib/validation";
import { buildShipment } from "@/lib/dealer-shipment";
import { getDueSettings, addDays } from "@/lib/settings";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { EntityStatus, PaymentMethod } from "@/generated/prisma/enums";

export type DealerState = { error?: string; ok?: string };

function parseMethod(v: FormDataEntryValue | null): PaymentMethod {
  const s = String(v ?? "");
  return s in PaymentMethod ? (s as PaymentMethod) : PaymentMethod.TRANSFER;
}

/** FR-39: Bayi kaydı (+ opsiyonel DEALER login hesabı). */
export async function createDealer(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();

  const code = (formData.get("code") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  if (!code || !title) return { error: "Bayi kodu ve ünvanı zorunludur." };

  // Opsiyonel login: e-posta + şifre verilirse DEALER kullanıcısı oluşturulur.
  const loginEmail = ((formData.get("loginEmail") as string) || "").trim();
  const loginPassword = ((formData.get("loginPassword") as string) || "").trim();
  if (loginEmail && loginPassword.length < 6) {
    return { error: "Login şifresi en az 6 karakter olmalıdır." };
  }

  const data = {
    code,
    title,
    taxOffice: ((formData.get("taxOffice") as string) || "").trim() || null,
    taxNo: ((formData.get("taxNo") as string) || "").trim() || null,
    contactName: ((formData.get("contactName") as string) || "").trim() || null,
    phone: ((formData.get("phone") as string) || "").trim() || null,
    email: ((formData.get("email") as string) || "").trim() || null,
    address: ((formData.get("address") as string) || "").trim() || null,
  };

  let dealerId = "";
  try {
    dealerId = await prisma.$transaction(async (tx) => {
      let userId: string | null = null;
      if (loginEmail) {
        const user = await tx.user.create({
          data: {
            name: title,
            email: loginEmail,
            passwordHash: await bcrypt.hash(loginPassword, 10),
            role: "DEALER",
          },
        });
        userId = user.id;
      }
      const dealer = await tx.dealer.create({ data: { ...data, userId } });
      return dealer.id;
    });
  } catch {
    return { error: "Bayi kodu veya login e-postası zaten kullanılıyor." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_CREATE,
    entityType: "Dealer",
    entityId: dealerId,
    after: { ...data, hasLogin: !!loginEmail },
  });

  revalidatePath("/dealers");
  redirect(`/dealers/${dealerId}`);
}

/** FR-40: Bayi × ürün sabit net fiyatı tanımla/güncelle. */
export async function setDealerPrice(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();

  const dealerId = (formData.get("dealerId") as string)?.trim();
  const productId = (formData.get("productId") as string)?.trim();
  const priceTL = Number(formData.get("netPrice"));
  const vatRate = Number(formData.get("vatRate"));
  if (!dealerId || !productId) return { error: "Bayi ve ürün zorunludur." };
  if (!priceTLSchema.safeParse(priceTL).success || priceTL <= 0) {
    return { error: "Geçerli bir net fiyat giriniz." };
  }
  if (!Number.isInteger(vatRate) || vatRate < 0 || vatRate > 100) {
    return { error: "KDV oranı 0-100 arası olmalıdır." };
  }

  await prisma.dealerPrice.upsert({
    where: { dealerId_productId: { dealerId, productId } },
    create: { dealerId, productId, netPrice: tlToKurus(priceTL), vatRate },
    update: { netPrice: tlToKurus(priceTL), vatRate },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_PRICE_SET,
    entityType: "Dealer",
    entityId: dealerId,
    after: { productId, netPrice: tlToKurus(priceTL), vatRate },
  });

  revalidatePath(`/dealers/${dealerId}`);
  return { ok: "Fiyat kaydedildi." };
}

/**
 * 🔴 FR-42/FR-43: Sevkiyatı ONAYLAR — stok ATOMİK düşer, cariye yazılır.
 * TALEP kaydı zaten kalemleriyle mevcut; onay anında stok kontrol edilir.
 * Admin doğrudan sevkiyat da bu yolla oluşturur (önce TALEP, hemen onay).
 */
async function approveShipmentTx(shipmentId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const shipment = await tx.dealerShipment.findUnique({
      where: { id: shipmentId },
      include: { items: true },
    });
    if (!shipment) throw new Error("Sevkiyat bulunamadı.");
    if (shipment.status !== "TALEP") throw new Error("Bu sevkiyat zaten işlenmiş.");

    const { defaultDueDays } = await getDueSettings();

    for (const item of shipment.items) {
      // AD-04: koşul veritabanında — iki kanal aynı stoğa yazsa da negatife düşmez.
      const res = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (res.count === 0) {
        const p = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });
        // FR-43: stok yetersizse sevkiyat tamamen reddedilir (transaction geri alınır).
        throw new Error(
          `${p?.name ?? "Ürün"} için yeterli stok yok (mevcut: ${p?.stock ?? 0}).`
        );
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          note: "Bayi sevkiyatı",
          dealerShipmentId: shipment.id,
        },
      });
    }

    await tx.dealerShipment.update({
      where: { id: shipmentId },
      data: {
        status: "ONAYLANDI",
        approvedBy: adminId,
        approvedAt: new Date(),
        dueDate: addDays(new Date(), defaultDueDays),
      },
    });
  });
}

export async function approveShipment(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();
  const shipmentId = (formData.get("shipmentId") as string)?.trim();
  if (!shipmentId) return { error: "Sevkiyat seçilmedi." };

  try {
    await approveShipmentTx(shipmentId, session.user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sevkiyat onaylanamadı." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_SHIPMENT_APPROVE,
    entityType: "DealerShipment",
    entityId: shipmentId,
    after: { status: "ONAYLANDI" },
  });

  revalidatePath("/dealer-shipments");
  return { ok: "Sevkiyat onaylandı; stok düşüldü ve cariye yazıldı." };
}

/** Admin doğrudan sevkiyat oluşturur (FR-42) — talep + hemen onay. */
export async function createShipment(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();

  const dealerId = (formData.get("dealerId") as string)?.trim();
  if (!dealerId) return { error: "Bayi seçiniz." };

  let raw: unknown;
  try {
    raw = JSON.parse((formData.get("items") as string) || "[]");
  } catch {
    return { error: "Kalemler okunamadı." };
  }
  const lines = Array.isArray(raw)
    ? raw
        .map((l) => ({ productId: String(l.productId), quantity: Number(l.quantity) }))
        .filter((l) => l.productId && l.quantity > 0)
    : [];
  if (lines.length === 0) return { error: "En az bir kalem giriniz." };

  let shipmentId = "";
  try {
    shipmentId = await prisma.$transaction(async (tx) => {
      const built = await buildShipment(dealerId, lines, tx);
      const shipment = await tx.dealerShipment.create({
        data: {
          dealerId,
          status: "TALEP",
          netTotal: built.netTotal,
          vatTotal: built.vatTotal,
          grossTotal: built.grossTotal,
          items: { create: built.items },
        },
      });
      return shipment.id;
    });
    await approveShipmentTx(shipmentId, session.user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sevkiyat oluşturulamadı." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_SHIPMENT_APPROVE,
    entityType: "DealerShipment",
    entityId: shipmentId,
    after: { direct: true },
  });

  revalidatePath("/dealer-shipments");
  return { ok: "Sevkiyat oluşturuldu ve onaylandı." };
}

/** FR-43 tersi: talebi reddet (hiç etki olmamıştı, stok/cari değişmez). */
export async function rejectShipment(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();
  const shipmentId = (formData.get("shipmentId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!shipmentId) return { error: "Sevkiyat seçilmedi." };

  const shipment = await prisma.dealerShipment.findUnique({
    where: { id: shipmentId },
  });
  if (!shipment) return { error: "Sevkiyat bulunamadı." };
  if (shipment.status !== "TALEP") return { error: "Yalnızca talepler reddedilebilir." };

  await prisma.dealerShipment.update({
    where: { id: shipmentId },
    data: {
      status: "REDDEDILDI",
      cancelledBy: session.user.id,
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_SHIPMENT_REJECT,
    entityType: "DealerShipment",
    entityId: shipmentId,
    after: { status: "REDDEDILDI", reason },
  });

  revalidatePath("/dealer-shipments");
  return { ok: "Talep reddedildi." };
}

/** FR-44: Onaylı sevkiyat iptali — stok IN ile geri, cari geri alınır. */
export async function cancelShipment(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();
  const shipmentId = (formData.get("shipmentId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!shipmentId) return { error: "Sevkiyat seçilmedi." };

  const shipment = await prisma.dealerShipment.findUnique({
    where: { id: shipmentId },
    include: { items: true },
  });
  if (!shipment) return { error: "Sevkiyat bulunamadı." };
  if (shipment.status !== "ONAYLANDI") {
    return { error: "Yalnızca onaylı sevkiyatlar iptal edilebilir." };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of shipment.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "IN",
          quantity: item.quantity,
          note: "Bayi sevkiyat iptali",
          dealerShipmentId: shipment.id,
        },
      });
    }
    // Cari otomatik geri döner: IPTAL sevkiyat getDealerCari'de sayılmaz (RULE-08).
    await tx.dealerShipment.update({
      where: { id: shipmentId },
      data: {
        status: "IPTAL",
        cancelledBy: session.user.id,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_SHIPMENT_CANCEL,
    entityType: "DealerShipment",
    entityId: shipmentId,
    after: { status: "IPTAL", reason },
  });

  revalidatePath("/dealer-shipments");
  return { ok: "Sevkiyat iptal edildi; stok geri yüklendi." };
}

/** FR-46: Bayi ödemesi kaydı. */
export async function recordDealerPayment(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const session = await requireAdmin();

  const dealerId = (formData.get("dealerId") as string)?.trim();
  const amountTL = Number(formData.get("amount"));
  if (!dealerId) return { error: "Bayi bulunamadı." };
  if (!amountTLSchema.safeParse(amountTL).success) {
    return { error: "Geçerli bir ödeme tutarı giriniz." };
  }

  const payment = await prisma.dealerPayment.create({
    data: {
      dealerId,
      amount: tlToKurus(amountTL),
      method: parseMethod(formData.get("method")),
      referenceNo: ((formData.get("referenceNo") as string) || "").trim() || null,
      note: ((formData.get("note") as string) || "").trim() || null,
      recordedBy: session.user.id,
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_PAYMENT_CREATE,
    entityType: "DealerPayment",
    entityId: payment.id,
    after: { dealerId, amount: payment.amount },
  });

  revalidatePath(`/dealers/${dealerId}`);
  return { ok: "Ödeme kaydedildi." };
}

/** Bayi pasifleştir/aktifleştir — pasif bayi login olamaz (FR-46g). */
export async function toggleDealerStatus(dealerId: string) {
  const session = await requireAdmin();
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  if (!dealer) redirect("/dealers");

  const next =
    dealer.status === EntityStatus.ACTIVE
      ? EntityStatus.PASSIVE
      : EntityStatus.ACTIVE;

  await prisma.$transaction(async (tx) => {
    await tx.dealer.update({ where: { id: dealerId }, data: { status: next } });
    // Login hesabı da aynı duruma alınır: pasif bayi giriş yapamamalı (BRK-04).
    if (dealer.userId) {
      await tx.user.update({
        where: { id: dealer.userId },
        data: { status: next },
      });
    }
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DEALER_UPDATE,
    entityType: "Dealer",
    entityId: dealerId,
    before: { status: dealer.status },
    after: { status: next },
  });

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
}
