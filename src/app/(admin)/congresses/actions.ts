"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { priceTLSchema } from "@/lib/validation";
import { refundReservation } from "@/lib/congress-service";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { CongressStatus } from "@/generated/prisma/enums";

export type CongressState = { error?: string; ok?: string };

type CongressData = {
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  quota: number | null;
};

/** Kongre form doğrulaması — create ve update ortak kullanır. */
function parseCongressForm(
  formData: FormData
): { data: CongressData } | { error: string } {
  const name = (formData.get("name") as string)?.trim();
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));
  if (!name) return { error: "Kongre adı zorunludur." };
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Geçerli başlangıç ve bitiş tarihi giriniz." };
  }
  if (endDate < startDate) {
    return { error: "Bitiş tarihi başlangıçtan önce olamaz." };
  }

  const quotaRaw = String(formData.get("quota") ?? "").trim();
  const quota = quotaRaw === "" ? null : Number(quotaRaw);
  if (quota !== null && (!Number.isInteger(quota) || quota < 0)) {
    return { error: "Kontenjan pozitif tam sayı olmalıdır." };
  }

  return {
    data: {
      name,
      description: ((formData.get("description") as string) || "").trim() || null,
      startDate,
      endDate,
      location: ((formData.get("location") as string) || "").trim() || null,
      quota,
    },
  };
}

export async function createCongress(
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();

  const parsed = parseCongressForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const congress = await prisma.congress.create({
    data: { ...parsed.data, status: CongressStatus.YAYINDA },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_CREATE,
    entityType: "Congress",
    entityId: congress.id,
    after: congress,
  });

  revalidatePath("/congresses");
  return { ok: "Kongre oluşturuldu." };
}

export async function updateCongress(
  id: string,
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();

  const parsed = parseCongressForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const before = await prisma.congress.findUnique({ where: { id } });
  if (!before) return { error: "Kongre bulunamadı." };

  const updated = await prisma.congress.update({
    where: { id },
    data: parsed.data,
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_UPDATE,
    entityType: "Congress",
    entityId: id,
    before,
    after: updated,
  });

  revalidatePath("/congresses");
  redirect("/congresses");
}

/** Kongreyi iptal eder (status = IPTAL). Kayıtlara dokunmaz — güvenli. */
export async function cancelCongress(id: string): Promise<CongressState> {
  const session = await requireAdmin();
  const congress = await prisma.congress.findUnique({ where: { id } });
  if (!congress) return { error: "Kongre bulunamadı." };

  await prisma.congress.update({
    where: { id },
    data: { status: CongressStatus.IPTAL },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_CANCEL,
    entityType: "Congress",
    entityId: id,
    before: { status: congress.status },
    after: { status: "IPTAL" },
  });

  revalidatePath("/congresses");
  return { ok: "Kongre iptal edildi." };
}

/** Kongreyi siler — YALNIZCA hiç kaydı yoksa (paketleri Cascade ile gider). */
export async function deleteCongress(id: string): Promise<CongressState> {
  const session = await requireAdmin();

  const regCount = await prisma.congressRegistration.count({
    where: { package: { congressId: id } },
  });
  if (regCount > 0) {
    return {
      error:
        "Kaydı olan kongre silinemez. Bunun yerine 'İptal Et' kullanın (kayıt geçmişi korunur).",
    };
  }

  await prisma.congress.delete({ where: { id } });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_DELETE,
    entityType: "Congress",
    entityId: id,
  });

  revalidatePath("/congresses");
  return { ok: "Kongre silindi." };
}

/** Paket ad/değer/kontenjan doğrulaması — create ve update ortak. */
function parsePackageForm(
  formData: FormData
): { name: string; value: bigint; quota: number | null } | { error: string } {
  const name = (formData.get("name") as string)?.trim();
  const valueTL = Number(formData.get("value"));
  if (!name) return { error: "Paket adı zorunludur." };
  if (!priceTLSchema.safeParse(valueTL).success || valueTL <= 0) {
    return { error: "Geçerli bir paket değeri giriniz." };
  }

  const quotaRaw = String(formData.get("quota") ?? "").trim();
  const quota = quotaRaw === "" ? null : Number(quotaRaw);
  if (quota !== null && (!Number.isInteger(quota) || quota < 0)) {
    return { error: "Kontenjan pozitif tam sayı olmalıdır." };
  }

  return { name, value: tlToKurus(valueTL), quota };
}

export async function createPackage(
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();

  const congressId = (formData.get("congressId") as string)?.trim();
  if (!congressId) return { error: "Kongre seçiniz." };
  const parsed = parsePackageForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const pkg = await prisma.congressPackage.create({
    data: { congressId, ...parsed },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_PACKAGE_CREATE,
    entityType: "CongressPackage",
    entityId: pkg.id,
    after: pkg,
  });

  revalidatePath("/congresses");
  return { ok: "Paket eklendi." };
}

/**
 * Paket günceller. Değer değişikliği GEÇMİŞ KAYITLARI etkilemez:
 * `CongressRegistration.reservedAmount` talep anında snapshot'lanır.
 */
export async function updatePackage(
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();
  const id = (formData.get("packageId") as string)?.trim();
  if (!id) return { error: "Paket seçilmedi." };

  const parsed = parsePackageForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const before = await prisma.congressPackage.findUnique({ where: { id } });
  if (!before) return { error: "Paket bulunamadı." };

  const updated = await prisma.congressPackage.update({
    where: { id },
    data: parsed,
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_PACKAGE_UPDATE,
    entityType: "CongressPackage",
    entityId: id,
    before,
    after: updated,
  });

  revalidatePath("/congresses");
  return { ok: "Paket güncellendi." };
}

/** Paketi siler — YALNIZCA hiç kaydı yoksa. */
export async function deletePackage(_prev: CongressState, formData: FormData): Promise<CongressState> {
  const session = await requireAdmin();
  const id = (formData.get("packageId") as string)?.trim();
  if (!id) return { error: "Paket seçilmedi." };

  const regCount = await prisma.congressRegistration.count({
    where: { packageId: id },
  });
  if (regCount > 0) {
    return { error: "Kaydı olan paket silinemez." };
  }

  await prisma.congressPackage.delete({ where: { id } });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_PACKAGE_DELETE,
    entityType: "CongressPackage",
    entityId: id,
  });

  revalidatePath("/congresses");
  return { ok: "Paket silindi." };
}

/** FR-53: Admin talebi onaylar. Bakiye TALEP anında rezerve edilmişti. */
export async function approveRegistration(
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();
  const id = (formData.get("registrationId") as string)?.trim();
  if (!id) return { error: "Kayıt seçilmedi." };

  const reg = await prisma.congressRegistration.findUnique({
    where: { id },
    include: { package: true },
  });
  if (!reg) return { error: "Kayıt bulunamadı." };
  if (reg.status !== "TALEP") return { error: "Bu kayıt zaten işlenmiş." };

  // FR-55: kontenjan kontrolü onay anında da yapılır.
  if (reg.package.quota !== null) {
    const approved = await prisma.congressRegistration.count({
      where: { packageId: reg.packageId, status: "ONAYLANDI" },
    });
    if (approved >= reg.package.quota) {
      return { error: "Paket kontenjanı dolu." };
    }
  }

  await prisma.congressRegistration.update({
    where: { id },
    data: {
      status: "ONAYLANDI",
      approvedAt: new Date(),
      approvedBy: session.user.id,
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_REGISTRATION_APPROVE,
    entityType: "CongressRegistration",
    entityId: id,
    after: { status: "ONAYLANDI" },
  });

  revalidatePath("/congresses");
  return { ok: "Kayıt onaylandı." };
}

/**
 * FR-56: Kayıt iptali / reddi — bakiye iade edilir, kontenjan serbest kalır.
 * İade ORİJİNAL kazanımlara yapılır; son kullanma tarihi UZAMAZ.
 */
export async function cancelRegistration(
  _prev: CongressState,
  formData: FormData
): Promise<CongressState> {
  const session = await requireAdmin();
  const id = (formData.get("registrationId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!id) return { error: "Kayıt seçilmedi." };

  const reg = await prisma.congressRegistration.findUnique({ where: { id } });
  if (!reg) return { error: "Kayıt bulunamadı." };
  if (reg.status === "IPTAL" || reg.status === "REDDEDILDI") {
    return { error: "Bu kayıt zaten iptal edilmiş." };
  }

  const refunded = await prisma.$transaction(async (tx) => {
    const amount = await refundReservation(tx, id, session.user.id);
    await tx.congressRegistration.update({
      where: { id },
      data: {
        status: reg.status === "TALEP" ? "REDDEDILDI" : "IPTAL",
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
        cancelReason: reason,
      },
    });
    return amount;
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.CONGRESS_REGISTRATION_CANCEL,
    entityType: "CongressRegistration",
    entityId: id,
    before: { status: reg.status },
    after: { status: "IPTAL", refunded, reason },
  });

  revalidatePath("/congresses");
  return { ok: "Kayıt iptal edildi; bakiye iade edildi." };
}
