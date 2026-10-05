"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { hesaplaStok, varsayilanDepoId } from "@/lib/stok";

export type StockFormState = { error?: string; ok?: boolean };

export async function addStockEntry(
  _prev: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  const session = await requireAdmin();

  const productId = formData.get("productId") as string;
  const quantity = parseInt(String(formData.get("quantity") ?? ""), 10);
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!productId) return { error: "Ürün seçiniz." };
  if (!quantitySchema.safeParse(quantity).success)
    return { error: "Geçerli bir miktar giriniz." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Ürün bulunamadı." };

  // Stok miktarı saklanmaz; giriş yalnız hareket yazar (ADR-005).
  await prisma.stockMovement.create({
    data: {
      productId,
      locationId: await varsayilanDepoId(),
      type: "GIRIS",
      quantity,
      note: note ?? "Stok girişi",
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.STOCK_ENTRY,
    entityType: "Product",
    entityId: productId,
    after: { quantity, newStock: await hesaplaStok(productId), note },
  });

  revalidatePath("/stock");
  revalidatePath("/products");
  return { ok: true };
}
