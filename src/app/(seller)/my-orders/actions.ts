"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type OrderFormState = { error?: string };

type LineInput = { productId: string; quantity: number };

const orderLinesSchema = z
  .array(z.object({ productId: z.string().min(1), quantity: quantitySchema }))
  .min(1);

export async function createOrder(
  _prev: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorName = (formData.get("doctorName") as string)?.trim();
  const hospital = ((formData.get("hospital") as string) || "").trim() || null;

  if (!doctorName) return { error: "Doktor adı zorunludur." };

  let raw: unknown;
  try {
    raw = JSON.parse((formData.get("items") as string) || "[]");
  } catch {
    return { error: "Sipariş kalemleri okunamadı." };
  }

  const parsedLines = orderLinesSchema.safeParse(raw);
  if (!parsedLines.success)
    return { error: "En az bir ürün ve geçerli miktar giriniz." };
  const lines: LineInput[] = parsedLines.data;

  let created: { id: string; totalAmount: number };
  try {
    created = await prisma.$transaction(async (tx) => {
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

      return { id: order.id, totalAmount };
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Sipariş oluşturulamadı.",
    };
  }

  await createAuditLog({
    actorId: sellerId,
    action: AUDIT_ACTIONS.ORDER_CREATE,
    entityType: "Order",
    entityId: created.id,
    after: {
      doctorName,
      hospital,
      totalAmount: created.totalAmount,
      itemCount: lines.length,
    },
  });

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
