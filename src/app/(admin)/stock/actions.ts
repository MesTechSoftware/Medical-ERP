"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { quantitySchema } from "@/lib/validation";

export type StockFormState = { error?: string; ok?: boolean };

export async function addStockEntry(
  _prev: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  await requireAdmin();

  const productId = formData.get("productId") as string;
  const quantity = Number(formData.get("quantity"));
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!productId) return { error: "Ürün seçiniz." };
  if (!quantitySchema.safeParse(quantity).success)
    return { error: "Geçerli bir miktar giriniz." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Ürün bulunamadı." };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    }),
    prisma.stockMovement.create({
      data: { productId, type: "IN", quantity, note: note ?? "Stok girişi" },
    }),
  ]);

  revalidatePath("/stock");
  revalidatePath("/products");
  return { ok: true };
}
