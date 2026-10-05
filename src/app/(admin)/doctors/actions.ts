"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { degistirDoktorSahibi } from "@/lib/sahiplik";

export type TransferState = { error?: string; ok?: string };

const KURAL_MESAJI = {
  SAHIP_AKTIF_SATICI_DEGIL: "Yalnız aktif bir satıcıya devir yapılabilir.",
  BAYI_SAHIP_ATANAMAZ: "Bayinin sorumlu satıcısı olmaz.",
} as const;

/**
 * FR-06 / X-13: yönetici doktoru başka satıcıya devreder; gerekçe zorunlu, iz tutulur.
 * FR-07: geçmiş siparişler ESKİ satıcıda kalır — `Order.sellerId`'ye dokunulmaz.
 * Sahiplik yalnız `degistirDoktorSahibi()` ile değişir (X-17 §(1)); toplu devir 1B madde 3'te.
 */
export async function transferDoctor(
  _prev: TransferState,
  formData: FormData
): Promise<TransferState> {
  const session = await requireAdmin();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const newSellerId = (formData.get("sellerId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim();

  if (!doctorId) return { error: "Doktor seçilmedi." };
  if (!reason) return { error: "Gerekçe zorunludur." };

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return { error: "Doktor bulunamadı." };

  // Boş seçim = sahipsiz bırak (X-17 §(5)).
  const targetSellerId = newSellerId || null;
  if (doctor.ownerSellerId === targetSellerId) {
    return { error: "Doktor zaten bu sahiplikte." };
  }

  const sonuc = await prisma.$transaction((tx) =>
    degistirDoktorSahibi([doctorId], targetSellerId, { metin: reason, yapanId: session.user.id }, tx)
  );
  if (sonuc.durum === "HATA") return { error: KURAL_MESAJI[sonuc.kuralKodu] };

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
