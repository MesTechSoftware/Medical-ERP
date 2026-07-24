"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type TransferState = { error?: string; ok?: string };

/**
 * FR-06: Admin doktoru başka satıcıya devreder; devir kaydı tutulur.
 * FR-07: Geçmiş siparişler ESKİ satıcıda kalır — `Order.sellerId`'ye
 *        dokunulmaz. Sadece doktorun güncel sahipliği değişir.
 */
export async function transferDoctor(
  _prev: TransferState,
  formData: FormData
): Promise<TransferState> {
  const session = await requireAdmin();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const newSellerId = (formData.get("sellerId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;

  if (!doctorId) return { error: "Doktor seçilmedi." };

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return { error: "Doktor bulunamadı." };

  // Boş seçim = sahipsiz havuza al (FR-08 ile aynı duruma düşürür).
  const targetSellerId = newSellerId || null;

  if (targetSellerId) {
    const seller = await prisma.user.findFirst({
      where: { id: targetSellerId, role: "SELLER" },
      select: { id: true, status: true },
    });
    if (!seller) return { error: "Geçerli bir satıcı seçiniz." };
    if (seller.status !== "ACTIVE")
      return { error: "Pasif bir satıcıya devir yapılamaz." };
  }

  if (doctor.ownerSellerId === targetSellerId) {
    return { error: "Doktor zaten bu sahiplikte." };
  }

  await prisma.$transaction(async (tx) => {
    // Açık atamayı kapat.
    await tx.doctorAssignment.updateMany({
      where: { doctorId, toDate: null },
      data: { toDate: new Date() },
    });

    await tx.doctor.update({
      where: { id: doctorId },
      data: { ownerSellerId: targetSellerId },
    });

    // Sahipsiz havuza alınırken yeni atama satırı yazılmaz.
    if (targetSellerId) {
      await tx.doctorAssignment.create({
        data: {
          doctorId,
          sellerId: targetSellerId,
          assignedBy: session.user.id,
          reason,
        },
      });
    }
  });

  // RULE-13: devir istisnasız audit'e yazılır.
  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.DOCTOR_TRANSFER,
    entityType: "Doctor",
    entityId: doctorId,
    before: { ownerSellerId: doctor.ownerSellerId },
    after: { ownerSellerId: targetSellerId, reason },
  });

  revalidatePath("/doctors");
  return { ok: "Devir tamamlandı." };
}
