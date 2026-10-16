"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { priceSchema, quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { uretBelgeNo } from "@/lib/belge-no";
import { stokHareketiYaz, stokKilitle, varsayilanDepoId } from "@/lib/stok";
import { canSellerOrderForDoctor } from "@/lib/doctor";
import { policy } from "@/lib/policy";

export type OrderFormState = { error?: string };

const orderLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: quantitySchema,
      // Satıcı birim fiyatı değiştirebilir (FR-12, X-5 §(9) `birim_fiyat`).
      // Daima NET (KDV hariç), ham ondalık metin olarak gelir (X-5 §(6)).
      // Girilmezse liste fiyatı kullanılır (X-5 §(9)).
      birimFiyat: priceSchema.optional(),
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
    select: { id: true, fullName: true, ownerSellerId: true, status: true, paymentTermDays: true },
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
  const lines = parsedLines.data;

  let created: { id: string; documentNo: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      // Kilit sırası: ürün satırları → belge sayacı (ADR-008 §(1)).
      await stokKilitle(tx, lines.map((l) => l.productId));
      const items = [];
      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { id: true, name: true, status: true, taxRate: { select: { rate: true } } },
        });
        if (!product) throw new Error(`Ürün bulunamadı.`);
        if (product.status !== "AKTIF")
          throw new Error(`${product.name} pasif durumda.`);

        // Liste fiyatı tek yoldan çözülür; atanmış listede satır yoksa varsayılana
        // düşülmez (X-10 §(3)). Satıcının girdiği fiyat ayrıca saklanır (X-5 §(9)).
        const fiyat = await cozumleBirimFiyat(product.id, doctor.id, tx);
        if (fiyat.durum === "HATA")
          throw new Error(`${product.name} için fiyat çözümlenemedi.`);

        // RULE-03 taban fiyat reddi C6'da söküldü: iskonto tavanı yok, liste üstü
        // satış serbest (GÇ-8, A-10 · Ü-3 §(10)). Taban etiketi 1B'de gelir.

        // Fiyat ve oran sipariş anında DONDURULUR (RULE-04, C-6 §(2-a)).
        items.push({
          productId: product.id,
          quantity: line.quantity,
          listPrice: fiyat.listeFiyat,
          unitPrice: line.birimFiyat ?? fiyat.listeFiyat,
          vatRate: product.taxRate.rate,
        });
      }

      const documentNo = await uretBelgeNo("SIP", tx);
      const order = await tx.order.create({
        data: {
          documentNo,
          sellerId,
          doctorId,
          // Bugünkü akış onaylı sipariş açar; teklif aşaması 1B madde 7'dedir (A-5).
          stage: "ONAYLI",
          status: "BEKLIYOR",
          // Vade tarihi cari harekettedir (X-11 §(4)); siparişte gün sayısı durur (A-7).
          paymentTermDays: doctor.paymentTermDays ?? policy.finance.odemeVadesiGunVarsayilan,
          items: { create: items },
        },
      });

      // Stok bugün sipariş anında düşer; sevkiyata taşınması 1B madde 7'dir (A-3).
      // Hareketin kaynağı sipariştir (B-7: her hareket bir belgeden doğar).
      // Negatif stok engellenmez (B-4); NEGATIF_STOK kalemleri OnayBlogu'na
      // `blokKontrolleriniCalistir()` ile bağlanır (A-8, 1B madde 1 #6).
      const locationId = await varsayilanDepoId(tx);
      await stokHareketiYaz(
        tx,
        items.map((item) => ({
          productId: item.productId,
          locationId,
          type: "CIKIS" as const,
          quantity: item.quantity,
          note: "Sipariş çıkışı",
          orderId: order.id,
        }))
      );

      return { id: order.id, documentNo };
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
      documentNo: created.documentNo,
      doctorId,
      doctorName: doctor.fullName,
      itemCount: lines.length,
    },
  });

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
