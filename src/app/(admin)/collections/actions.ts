"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { amountSchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { uretBelgeNo } from "@/lib/belge-no";
import { hesaplaKomisyonTutari } from "@/lib/satir-tutarlari";
import { simdi } from "@/lib/zaman";

export type CollectionState = { error?: string; ok?: string };

/**
 * 🔴 Tahsilat kaydı — sistemin MERKEZÎ olayı (RULE-12).
 *
 * Tahsilat kaydı yazılır; doktor bakiyesi hareketlerden HESAPLANIR (ayrı
 * kolon yok — RULE-08). Tahsilat hiçbir siparişle eşleştirilmez: FIFO mahsup
 * C3'te söküldü (GÇ-3, X-6), kongre kazanımı C2'de (GÇ-4).
 *
 * Ödeme yöntemi tanım tablosudur; komisyon oranı kayda kopyalanır ve donar (A-11).
 * Cari hareket (`TAHSILAT`) aynı transaction'da yazılır — 1B madde 2 (X-11 §(5), X-2);
 * `CM` → 1B arası yazılmaz (FAZ1 R-11).
 */
export async function recordCollection(
  _prev: CollectionState,
  formData: FormData
): Promise<CollectionState> {
  const session = await requireAdmin();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const paymentMethodId = (formData.get("paymentMethodId") as string)?.trim();
  const tutar = amountSchema.safeParse(formData.get("amount") ?? "");
  if (!doctorId) return { error: "Doktor seçiniz." };
  if (!tutar.success) {
    return { error: "Geçerli bir tahsilat tutarı giriniz." };
  }
  if (!paymentMethodId) return { error: "Ödeme yöntemi seçiniz." };
  const amount = tutar.data;

  let paymentId = "";
  let documentNo = "";
  try {
    await prisma.$transaction(async (tx) => {
      const yontem = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      if (!yontem || !yontem.isActive) throw new Error("Ödeme yöntemi bulunamadı.");
      documentNo = await uretBelgeNo("THS", tx);
      const payment = await tx.doctorPayment.create({
        data: {
          documentNo,
          doctorId,
          amount,
          paymentMethodId,
          commissionRate: yontem.commissionRate,
          commissionAmount: hesaplaKomisyonTutari(amount, yontem.commissionRate),
          paidAt: formData.get("paidAt")
            ? new Date(String(formData.get("paidAt")))
            : simdi(),
          referenceNo:
            ((formData.get("referenceNo") as string) || "").trim() || null,
          note: ((formData.get("note") as string) || "").trim() || null,
          recordedBy: session.user.id,
        },
      });
      paymentId = payment.id;
    });
  } catch {
    return { error: "Tahsilat kaydedilemedi." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COLLECTION_CREATE,
    entityType: "DoctorPayment",
    entityId: paymentId,
    after: { documentNo, doctorId, amount },
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
      cancelledAt: simdi(),
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
 * FR-22 / X-15 §(1): vade tarihi değiştirme. Vade CARİ HAREKETTEDİR (X-11 §(4));
 * yalnız `YONETICI`, gerekçe zorunlu, her değişiklik ize ve audit'e yazılır.
 * Vadede sistem sınırı YOKTUR (KARARLAR §2 madde 16).
 */
export async function changeDueDate(
  _prev: CollectionState,
  formData: FormData
): Promise<CollectionState> {
  const session = await requireAdmin();

  const ledgerEntryId = (formData.get("ledgerEntryId") as string)?.trim();
  const raw = (formData.get("newDueDate") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim();
  if (!ledgerEntryId || !raw) return { error: "Cari hareket ve yeni vade zorunludur." };
  if (!reason) return { error: "Gerekçe zorunludur." };

  // `date` kolonu: "YYYY-MM-DD" UTC gece yarısı olarak okunur, dilim taşımaz (E-1 §(1)).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { error: "Geçerli bir tarih giriniz." };
  const newDueDate = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(newDueDate.getTime())) {
    return { error: "Geçerli bir tarih giriniz." };
  }

  const entry = await prisma.ledgerEntry.findUnique({ where: { id: ledgerEntryId } });
  if (!entry) return { error: "Cari hareket bulunamadı." };
  if (entry.direction !== "BORC") return { error: "Vade yalnız borç hareketinde değişir." };

  const oldDueDate = entry.dueDate;
  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.update({ where: { id: ledgerEntryId }, data: { dueDate: newDueDate } });
    await tx.dueDateChange.create({
      data: {
        ledgerEntryId,
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
    entityType: "LedgerEntry",
    entityId: ledgerEntryId,
    before: { dueDate: oldDueDate },
    after: { dueDate: newDueDate, reason },
  });

  revalidatePath("/doctors");
  return { ok: "Vade güncellendi." };
}
