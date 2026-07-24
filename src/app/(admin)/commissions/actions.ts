"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  getNetAllocations,
  getPendingAdjustments,
  getSellerRate,
} from "@/lib/commission-service";
import {
  calculateCommission,
  isPeriodBefore,
  periodOf,
  type Period,
} from "@/lib/commission";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { CommissionStatus } from "@/generated/prisma/enums";

export type CommissionActionState = { error?: string; ok?: string };

function parsePeriod(formData: FormData): Period | null {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * FR-34: Dönemi kapat. Matrah, oran ve prim tutarı DONDURULUR.
 * RULE-05: kapanmış dönem bir daha değişmez.
 *
 * Açık (içinde bulunulan veya gelecek) dönem kapatılamaz — aksi halde ay
 * bitmeden gelen tahsilatlar matraha giremez ve sessizce kaybolur.
 */
export async function closePeriod(
  _prev: CommissionActionState,
  formData: FormData
): Promise<CommissionActionState> {
  const session = await requireAdmin();

  const sellerId = (formData.get("sellerId") as string)?.trim();
  const period = parsePeriod(formData);
  if (!sellerId || !period) return { error: "Satıcı ve dönem zorunludur." };

  if (!isPeriodBefore(period, periodOf(new Date()))) {
    return {
      error: "Yalnızca tamamlanmış (geçmiş) dönemler kapatılabilir.",
    };
  }

  const existing = await prisma.commissionPeriod.findUnique({
    where: {
      sellerId_year_month: {
        sellerId,
        year: period.year,
        month: period.month,
      },
    },
  });
  if (existing) return { error: "Bu dönem zaten kapatılmış." };

  const [netAllocations, adjustments, ratePercent] = await Promise.all([
    getNetAllocations(sellerId, period),
    getPendingAdjustments(sellerId, period),
    getSellerRate(sellerId),
  ]);

  const result = calculateCommission({
    netAllocations,
    adjustments: adjustments.map((a) => a.amount),
    ratePercent,
  });

  const created = await prisma.$transaction(async (tx) => {
    const p = await tx.commissionPeriod.create({
      data: {
        sellerId,
        year: period.year,
        month: period.month,
        baseAmount: result.baseAmount,
        ratePercent: result.ratePercent,
        commissionAmount: result.commissionAmount,
        closedBy: session.user.id,
      },
    });
    // Kullanılan düzeltmeleri bu döneme işaretle: bir daha sayılmasınlar.
    if (adjustments.length > 0) {
      await tx.commissionAdjustment.updateMany({
        where: { id: { in: adjustments.map((a) => a.id) } },
        data: { appliedPeriodId: p.id },
      });
    }
    return p;
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COMMISSION_PERIOD_CLOSE,
    entityType: "CommissionPeriod",
    entityId: created.id,
    after: created,
  });

  revalidatePath("/commissions");
  return { ok: "Dönem kapatıldı ve prim donduruldu." };
}

/** FR-36: HESAPLANDI → ONAYLANDI → ÖDENDİ. Geri dönüş yok. */
export async function advanceCommissionStatus(
  _prev: CommissionActionState,
  formData: FormData
): Promise<CommissionActionState> {
  const session = await requireAdmin();
  const periodId = (formData.get("periodId") as string)?.trim();
  if (!periodId) return { error: "Dönem seçilmedi." };

  const period = await prisma.commissionPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) return { error: "Dönem bulunamadı." };

  const next: Record<CommissionStatus, CommissionStatus | null> = {
    HESAPLANDI: CommissionStatus.ONAYLANDI,
    ONAYLANDI: CommissionStatus.ODENDI,
    ODENDI: null,
  };
  const target = next[period.status];
  if (!target) return { error: "Bu dönem zaten ödenmiş." };

  await prisma.commissionPeriod.update({
    where: { id: periodId },
    data: { status: target },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.COMMISSION_STATUS_CHANGE,
    entityType: "CommissionPeriod",
    entityId: periodId,
    before: { status: period.status },
    after: { status: target },
  });

  revalidatePath("/commissions");
  return { ok: `Durum güncellendi: ${target}` };
}
