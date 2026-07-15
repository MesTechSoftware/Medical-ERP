"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";

export type OrderFormState = { error?: string };

type LineInput = { productId: string; quantity: number };

export async function createOrder(
  _prev: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorName = (formData.get("doctorName") as string)?.trim();
  const hospital = ((formData.get("hospital") as string) || "").trim() || null;

  if (!doctorName) return { error: "Doktor adı zorunludur." };

  let lines: LineInput[];
  try {
    lines = JSON.parse((formData.get("items") as string) || "[]");
  } catch {
    return { error: "Sipariş kalemleri okunamadı." };
  }

  lines = lines.filter((l) => l.productId && l.quantity > 0);
  if (lines.length === 0)
    return { error: "En az bir ürün ve miktar giriniz." };

  try {
    await prisma.$transaction(async (tx) => {
      const items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
        });
        if (!product) throw new Error(`Ürün bulunamadı.`);
        if (product.status !== "ACTIVE")
          throw new Error(`${product.name} pasif durumda.`);
        if (product.stock < line.quantity)
          throw new Error(
            `${product.name} için yeterli stok yok (mevcut: ${product.stock}).`
          );

        items.push({
          productId: product.id,
          quantity: line.quantity,
          unitPrice: product.salePrice,
          lineTotal: product.salePrice * line.quantity,
        });
      }

      const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0);

      const order = await tx.order.create({
        data: {
          sellerId,
          doctorName,
          hospital,
          status: "PENDING",
          totalAmount,
          items: { create: items },
        },
      });

      // Stok düşümü + OUT hareketleri
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            note: "Sipariş çıkışı",
            orderId: order.id,
          },
        });
      }
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Sipariş oluşturulamadı.",
    };
  }

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
