"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { priceTLSchema, quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { tlToKurus } from "@/lib/money";
import { discountRate, lineTotals, sumLineTotals } from "@/lib/vat";
import { canSellerOrderForDoctor } from "@/lib/doctor";
import { addDays } from "@/lib/date";
import { policy } from "@/lib/policy";

export type OrderFormState = { error?: string };

type LineInput = { productId: string; quantity: number; netUnitPriceTL?: number };

const orderLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: quantitySchema,
      // Satıcı birim fiyatı değiştirebilir (FR-12). Girilmezse liste fiyatı kullanılır.
      // Her zaman NET (KDV hariç) TL olarak gelir; dönüşüm istemcide yapılır (FR-18).
      netUnitPriceTL: priceTLSchema.optional(),
    })
  )
  .min(1);

export async function createOrder(
  _prev: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorId = (formData.get("doctorId") as string)?.trim();
  if (!doctorId) return { error: "Doktor seçiniz." };

  // 🔴 FR-04 / RULE-02: sahiplik SUNUCU TARAFINDA doğrulanır. Arayüzde yalnızca
  // kendi doktorları listelenir ama ham istek de aynı kapıdan geçmek zorunda.
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, fullName: true, ownerSellerId: true, status: true },
  });
  if (!doctor) return { error: "Doktor bulunamadı." };

  const ownership = canSellerOrderForDoctor(sellerId, doctor);
  if (!ownership.allowed) return { error: ownership.reason };

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

  // FR-21: her siparişe vade tarihi girilir; varsayılan gün sayısı kurulum
  // düzeyi config'tir, ayar ekranı yoktur (GÇ-11, A-7).
  const dueDate = addDays(new Date(), policy.finance.odemeVadesiGunVarsayilan);

  let created: { id: string; grossTotal: bigint };
  try {
    created = await prisma.$transaction(async (tx) => {
      const items: {
        productId: string;
        quantity: number;
        netUnitPrice: bigint;
        listPriceAtSale: bigint;
        discountRate: number;
        vatRate: number;
        vatAmount: bigint;
        lineNetTotal: bigint;
        lineGrossTotal: bigint;
      }[] = [];

      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
        });
        if (!product) throw new Error(`Ürün bulunamadı.`);
        if (product.status !== "ACTIVE")
          throw new Error(`${product.name} pasif durumda.`);

        // Fiyat: satıcı girdiyse onu, girmediyse liste fiyatını kullan.
        const netUnitPrice =
          line.netUnitPriceTL !== undefined
            ? tlToKurus(line.netUnitPriceTL)
            : product.netListPrice;

        // RULE-03 taban fiyat reddi C6'da söküldü: iskonto tavanı yok, liste üstü
        // satış serbest (GÇ-8, A-10 · Ü-3 §(10)). Taban etiketi 1B'de gelir.

        // Stok düşümü ATOMİK: koşul WHERE'de, veritabanında değerlendirilir.
        // Önce okuyup JS'te karşılaştırmak (check-then-act) iki eşzamanlı
        // siparişin aynı son birimi satmasına izin veriyordu — stok negatife
        // düşebiliyordu. count === 0 => yeterli stok yoktu.
        const decremented = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (decremented.count === 0)
          throw new Error(
            `${product.name} için yeterli stok yok (mevcut: ${product.stock}).`
          );

        // Fiyat + KDV sipariş anında DONDURULUR (RULE-04). Yuvarlama kalem
        // bazındadır; sipariş toplamı bu değerlerin toplamıdır (bkz. vat.ts).
        const totals = lineTotals(netUnitPrice, line.quantity, product.vatRate);
        items.push({
          productId: product.id,
          quantity: line.quantity,
          netUnitPrice,
          listPriceAtSale: product.netListPrice,
          discountRate: discountRate(product.netListPrice, netUnitPrice),
          vatRate: product.vatRate,
          ...totals,
        });
      }

      const { netTotal, vatTotal, grossTotal } = sumLineTotals(items);

      const order = await tx.order.create({
        data: {
          sellerId,
          doctorId,
          status: "PENDING",
          dueDate,
          netTotal,
          vatTotal,
          grossTotal,
          items: { create: items },
        },
      });

      // Stok yukarıda düşüldü; burada yalnızca OUT hareketleri yazılır.
      for (const item of items) {
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

      return { id: order.id, grossTotal };
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
      doctorId,
      doctorName: doctor.fullName,
      grossTotal: created.grossTotal,
      itemCount: lines.length,
    },
  });

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
