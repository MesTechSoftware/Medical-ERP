"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { expiryFor } from "@/lib/congress-ledger";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type AdjustState = { error?: string; ok?: string };

/**
 * FR-57: Admin GEREKÇELİ manuel kongre bakiyesi düzeltmesi girebilir.
 * RULE-13: istisnasız audit log'a yazılır (§11 uyumluluk gereği kritik).
 *
 * Pozitif düzeltme yeni bir kazanım lotu gibi davranır (12 ay geçerli);
 * negatif düzeltme mevcut lotlardan FIFO ile düşer.
 */
export async function adjustCongressBalance(
  _prev: AdjustState,
  formData: FormData
): Promise<AdjustState> {
  const session = await requireAdmin();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const amountTL = Number(formData.get("amount"));
  const reason = ((formData.get("reason") as string) || "").trim();

  if (!doctorId) return { error: "Doktor bulunamadı." };
  if (!Number.isFinite(amountTL) || amountTL === 0) {
    return { error: "Sıfırdan farklı bir tutar giriniz." };
  }
  // Gerekçe ZORUNLU: denetim izi olmadan bakiye oynanamaz.
  if (reason.length < 5) {
    return { error: "Gerekçe zorunludur (en az 5 karakter)." };
  }

  const amount = tlToKurus(Math.abs(amountTL));
  const isCredit = amountTL > 0;

  try {
    await prisma.$transaction(async (tx) => {
      if (isCredit) {
        const now = new Date();
        await tx.congressLedger.create({
          data: {
            doctorId,
            type: "ADJUST",
            amount,
            earnedAt: now,
            expiresAt: expiryFor(now),
            remainingAmount: amount,
            refType: "Manual",
            note: reason,
            createdBy: session.user.id,
          },
        });
        return;
      }

      // Negatif düzeltme: FIFO ile mevcut lotlardan düş.
      const lots = await tx.congressLedger.findMany({
        where: {
          doctorId,
          type: { in: ["EARN", "ADJUST"] },
          remainingAmount: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { earnedAt: "asc" },
      });

      let remaining = amount;
      for (const lot of lots) {
        if (remaining === 0n) break;
        const take = remaining < lot.remainingAmount ? remaining : lot.remainingAmount;
        const res = await tx.congressLedger.updateMany({
          where: { id: lot.id, remainingAmount: { gte: take } },
          data: { remainingAmount: { decrement: take } },
        });
        if (res.count === 0) throw new Error("Bakiye eşzamanlı olarak değişti.");
        remaining -= take;
      }
      if (remaining > 0n) {
        throw new Error("Düşülecek yeterli bakiye yok.");
      }

      await tx.congressLedger.create({
        data: {
          doctorId,
          type: "ADJUST",
          amount: -amount,
          remainingAmount: 0n,
          expiresAt: null,
          refType: "Manual",
          note: reason,
          createdBy: session.user.id,
        },
      });
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Düzeltme uygulanamadı.",
    };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_BALANCE_ADJUST,
    entityType: "Doctor",
    entityId: doctorId,
    after: { amount: isCredit ? amount : -amount, reason },
  });

  revalidatePath(`/doctors/${doctorId}`);
  return { ok: "Bakiye düzeltmesi uygulandı." };
}
