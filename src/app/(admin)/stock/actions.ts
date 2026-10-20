"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { hesaplaStok, stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";

export async function addStockEntry(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireStaff();

  const productId = formData.get("productId") as string;
  const quantity = parseInt(String(formData.get("quantity") ?? ""), 10);
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!productId) return engel("ALAN_ZORUNLU", {}, "productId");
  if (!quantitySchema.safeParse(quantity).success) return engel("GECERSIZ_MIKTAR", {}, "quantity");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return engel("URUN_BULUNAMADI", {}, "productId");

  // Stok miktarı saklanmaz; giriş yalnız hareket yazar (ADR-005).
  await prisma.$transaction(async (tx) => {
    await stokHareketiYaz(tx, [
      { productId, locationId: await varsayilanDepoId(tx), type: "GIRIS", quantity, note: note ?? "Stok girişi" },
    ]);
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.STOCK_ENTRY,
        entityType: "Product",
        entityId: productId,
        after: { quantity, newStock: await hesaplaStok(productId, undefined, undefined, tx), note },
      },
      tx
    );
  });

  revalidatePath("/stock");
  revalidatePath("/products");
  return basarili();
}
