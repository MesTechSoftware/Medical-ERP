"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { priceTLSchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { EntityStatus } from "@/generated/prisma/enums";

export type ProductFormState = { error?: string };

function parseProductForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const code = (formData.get("code") as string)?.trim();
  // Fiyatlar NET (KDV hariç) girilir; kanonik değer nettir (FR-17, FR-19).
  const listPriceTL = Number(formData.get("netListPrice"));
  const minPriceTL = Number(formData.get("netMinPrice"));
  const vatRate = Number(formData.get("vatRate"));
  const status: EntityStatus =
    formData.get("status") === "PASSIVE"
      ? EntityStatus.PASSIVE
      : EntityStatus.ACTIVE;

  if (!name || !code) return { error: "Ürün adı ve kodu zorunludur." as const };
  if (!priceTLSchema.safeParse(listPriceTL).success)
    return { error: "Geçerli bir liste fiyatı giriniz." as const };
  if (!priceTLSchema.safeParse(minPriceTL).success)
    return { error: "Geçerli bir taban fiyat giriniz." as const };
  if (!Number.isInteger(vatRate) || vatRate < 0 || vatRate > 100)
    return { error: "KDV oranı 0-100 arasında tam sayı olmalıdır." as const };
  if (minPriceTL > listPriceTL)
    return {
      error: "Taban fiyat liste fiyatından yüksek olamaz." as const,
    };

  return {
    data: {
      name,
      code,
      netListPrice: tlToKurus(listPriceTL),
      netMinPrice: tlToKurus(minPriceTL),
      vatRate,
      status,
    },
  };
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.error) return { error: parsed.error };

  const initialStock = Math.max(0, Math.trunc(Number(formData.get("initialStock")) || 0));

  let product;
  try {
    product = await prisma.product.create({
      data: { ...parsed.data, stock: initialStock },
    });
  } catch {
    return { error: "Bu ürün kodu zaten kullanılıyor." };
  }

  // Başlangıç stoğu varsa hareket kaydı oluştur
  if (initialStock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: initialStock,
        note: "Başlangıç stok girişi",
      },
    });
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.PRODUCT_CREATE,
    entityType: "Product",
    entityId: product.id,
    after: product,
  });

  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.error) return { error: parsed.error };

  const before = await prisma.product.findUnique({ where: { id } });

  let updated;
  try {
    updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });
  } catch {
    return { error: "Bu ürün kodu zaten kullanılıyor." };
  }

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.PRODUCT_UPDATE,
    entityType: "Product",
    entityId: id,
    before,
    after: updated,
  });

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    redirect("/products?error=used");
  }
  await prisma.stockMovement.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  redirect("/products");
}
