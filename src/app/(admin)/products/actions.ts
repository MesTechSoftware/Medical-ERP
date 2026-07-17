"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { tlToKurus } from "@/lib/money";
import { priceTLSchema } from "@/lib/validation";
import { EntityStatus } from "@/generated/prisma/enums";

export type ProductFormState = { error?: string };

function parseProductForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const code = (formData.get("code") as string)?.trim();
  const priceTL = Number(formData.get("salePrice"));
  const status: EntityStatus =
    formData.get("status") === "PASSIVE"
      ? EntityStatus.PASSIVE
      : EntityStatus.ACTIVE;

  if (!name || !code) return { error: "Ürün adı ve kodu zorunludur." as const };
  if (!priceTLSchema.safeParse(priceTL).success)
    return { error: "Geçerli bir satış fiyatı giriniz." as const };

  return { data: { name, code, salePrice: tlToKurus(priceTL), status } };
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.error) return { error: parsed.error };

  const initialStock = Math.max(0, Math.trunc(Number(formData.get("initialStock")) || 0));

  try {
    await prisma.product.create({
      data: { ...parsed.data, stock: initialStock },
    });
  } catch {
    return { error: "Bu ürün kodu zaten kullanılıyor." };
  }

  // Başlangıç stoğu varsa hareket kaydı oluştur
  if (initialStock > 0) {
    const created = await prisma.product.findUnique({
      where: { code: parsed.data!.code },
    });
    if (created) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "IN",
          quantity: initialStock,
          note: "Başlangıç stok girişi",
        },
      });
    }
  }

  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.error) return { error: parsed.error };

  try {
    await prisma.product.update({
      where: { id },
      data: parsed.data,
    });
  } catch {
    return { error: "Bu ürün kodu zaten kullanılıyor." };
  }

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
