"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { EntityStatus } from "@/generated/prisma/enums";

export type SellerFormState = { error?: string };

export async function createSeller(
  _prev: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  const session = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const password = formData.get("password") as string;

  if (!name || !email) return { error: "Ad ve e-posta zorunludur." };
  if (!password || password.length < 4)
    return { error: "Şifre en az 4 karakter olmalıdır." };

  const status: EntityStatus =
    formData.get("status") === "PASSIVE"
      ? EntityStatus.PASSIVE
      : EntityStatus.ACTIVE;

  let seller;
  try {
    seller = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        status,
        role: "SELLER",
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  } catch {
    return { error: "Bu e-posta zaten kayıtlı." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.SELLER_CREATE,
    entityType: "Seller",
    entityId: seller.id,
    after: seller, // passwordHash sanitize ile çıkarılır
  });

  revalidatePath("/sellers");
  redirect("/sellers");
}

export async function updateSeller(
  id: string,
  _prev: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  const session = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const password = (formData.get("password") as string) || "";

  if (!name || !email) return { error: "Ad ve e-posta zorunludur." };

  const status: EntityStatus =
    formData.get("status") === "PASSIVE"
      ? EntityStatus.PASSIVE
      : EntityStatus.ACTIVE;

  const data: {
    name: string;
    email: string;
    phone: string | null;
    status: EntityStatus;
    passwordHash?: string;
  } = { name, email, phone, status };

  if (password) {
    if (password.length < 4)
      return { error: "Şifre en az 4 karakter olmalıdır." };
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const before = await prisma.user.findFirst({
    where: { id, role: "SELLER" },
  });

  let updated;
  try {
    updated = await prisma.user.update({ where: { id }, data });
  } catch {
    return { error: "Bu e-posta zaten kayıtlı." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.SELLER_UPDATE,
    entityType: "Seller",
    entityId: id,
    before, // passwordHash sanitize ile çıkarılır
    after: updated,
  });

  revalidatePath("/sellers");
  redirect("/sellers");
}

export async function deleteSeller(id: string) {
  await requireAdmin();
  // Satıcı ödemesi kavramı kalktı (D-01); artık sipariş ve doktor portföyü
  // silmeyi engelliyor — geçmiş siparişler eski satıcıda kalmalı (FR-07).
  const [orders, doctors] = await Promise.all([
    prisma.order.count({ where: { sellerId: id } }),
    prisma.doctor.count({ where: { ownerSellerId: id } }),
  ]);
  if (orders > 0 || doctors > 0) {
    redirect("/sellers?error=used");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/sellers");
  redirect("/sellers");
}
