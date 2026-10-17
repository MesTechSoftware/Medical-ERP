"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { portfoyuDevret } from "@/lib/sahiplik";

export type SellerFormState = { error?: string };

class PortfoyHatasi extends Error {}

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

  // E-2: aktiflik `isActive`'dir. Pasifleştirmede portföy seçimi `updateSeller`'dadır (X-17 §(5)).
  const isActive = formData.get("status") !== "PASIF";

  let seller;
  try {
    seller = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        isActive,
        role: "SATICI",
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

  const isActive = formData.get("status") !== "PASIF";

  const data: {
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    passwordHash?: string;
  } = { name, email, phone, isActive };

  if (password) {
    if (password.length < 4)
      return { error: "Şifre en az 4 karakter olmalıdır." };
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const before = await prisma.user.findFirst({
    where: { id, role: "SATICI" },
  });

  // Pasifleştirme portföyü bekletmez (X-17 §(5)): doktoru olan satıcı için hedef — tek bir
  // aktif satıcı ya da sahipsiz — ve gerekçe formun zorunlu alanıdır. Otomatik devir yoktur.
  let portfoy: { hedef: string | null; gerekce: string } | null = null;
  if (before?.isActive && !isActive) {
    const doktorSayisi = await prisma.doctor.count({ where: { ownerSellerId: id } });
    if (doktorSayisi > 0) {
      const secim = ((formData.get("portfoy") as string) || "").trim();
      const gerekce = ((formData.get("portfoyGerekce") as string) || "").trim();
      if (!secim)
        return {
          error: `Satıcının ${doktorSayisi} doktoru var. Doktorların devredileceği satıcıyı ya da "sahipsiz bırak"ı seçin.`,
        };
      if (!gerekce) return { error: "Portföy için gerekçe zorunludur." };
      portfoy = { hedef: secim === "SAHIPSIZ" ? null : secim, gerekce };
    }
  }

  let updated;
  try {
    // Önce pasifleştirilir: hedef olarak kendisi seçilemez (aktif SATICI kuralı).
    updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id }, data });
      if (portfoy) {
        const sonuc = await portfoyuDevret(tx, id, portfoy.hedef, {
          metin: portfoy.gerekce,
          yapanId: session.user.id,
        });
        if (sonuc.durum === "HATA") throw new PortfoyHatasi();
      }
      return u;
    });
  } catch (e) {
    if (e instanceof PortfoyHatasi)
      return { error: "Doktorlar yalnız aktif bir satıcıya devredilebilir." };
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
  // Sahiplik izinde adı geçen kullanıcı da silinmez (X-17 §(3) — iz olay kaydıdır).
  const [orders, doctors, iz] = await Promise.all([
    prisma.order.count({ where: { sellerId: id } }),
    prisma.doctor.count({ where: { ownerSellerId: id } }),
    prisma.doctorAssignment.count({
      where: { OR: [{ fromSellerId: id }, { toSellerId: id }, { changedById: id }] },
    }),
  ]);
  if (orders > 0 || doctors > 0 || iz > 0) {
    redirect("/sellers?error=used");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/sellers");
  redirect("/sellers");
}
