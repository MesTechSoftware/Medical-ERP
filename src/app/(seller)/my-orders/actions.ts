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
import { canSellerOrderForDoctor, kapsamliDoktorlariGetir } from "@/lib/doctor";
import { policy } from "@/lib/policy";
import { siparisSahibiniKilitle } from "@/lib/sahiplik";
import { IsHatasi } from "@/lib/hata";
import { engel, sert, type Bildirim, type IslemSonucu } from "@/lib/sonuc";

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
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorId = (formData.get("doctorId") as string)?.trim();
  if (!doctorId) return engel("ALAN_ZORUNLU", {}, "doctorId");

  // 🔴 FR-04 / RULE-02: sahiplik SUNUCU TARAFINDA doğrulanır. Arayüzde yalnızca
  // kendi doktorları listelenir ama ham istek de aynı kapıdan geçmek zorunda.
  // Kapsam dışındaki cari bulunmamış gibi davranır; varlığı ima edilmez (X-13 §(1), X-3 §(8)).
  const doctor = await prisma.doctor.findFirst({
    where: { AND: [kapsamliDoktorlariGetir(session.user), { id: doctorId }] },
    select: { id: true, fullName: true, ownerSellerId: true, status: true, paymentTermDays: true },
  });
  if (!doctor) return engel("DOKTOR_KAPSAM_DISI", {}, "doctorId");

  const ownership = canSellerOrderForDoctor(sellerId, doctor);
  if (!ownership.allowed) return engel(ownership.kuralKodu, {}, "doctorId");

  let raw: unknown;
  try {
    raw = JSON.parse((formData.get("items") as string) || "[]");
  } catch (e) {
    // Bozuk form girdisi iş hatasıdır; başka hata teknik hatadır (X-3 §(4)).
    if (e instanceof SyntaxError) return engel("SIPARIS_KALEMI_GECERSIZ");
    throw e;
  }

  const parsedLines = orderLinesSchema.safeParse(raw);
  if (!parsedLines.success) return engel("SIPARIS_KALEMI_GECERSIZ");
  const lines = parsedLines.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Kilit sırası: doktor satırı → ürün satırları → belge sayacı (ADR-008 §(1)).
      // Sahip kilit altında yeniden okunur: arada devir tamamlandıysa sipariş
      // reddedilir; satıcı alanı sipariş anındaki sahiptir (X-17 §(8), X-13 §(3)).
      const sahip = await siparisSahibiniKilitle(tx, doctorId, sellerId);
      if (sahip.durum === "HATA") throw new IsHatasi([sert(sahip.kuralKodu)]);
      await stokKilitle(tx, lines.map((l) => l.productId));
      const items = [];
      // Kalem hataları toplanır, hepsi birlikte döner (X-4 §(7)).
      const hatalar: Bildirim[] = [];
      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { id: true, name: true, status: true, taxRate: { select: { rate: true } } },
        });
        if (!product) {
          hatalar.push(sert("URUN_BULUNAMADI"));
          continue;
        }
        if (product.status !== "AKTIF") {
          hatalar.push(sert("URUN_PASIF", { urun: product.name }));
          continue;
        }

        // Liste fiyatı tek yoldan çözülür; atanmış listede satır yoksa varsayılana
        // düşülmez (X-10 §(3)) — `SERT`, satır kaydedilemez (X-4 §(4)). Satıcının
        // girdiği fiyat ayrıca saklanır (X-5 §(9)).
        const fiyat = await cozumleBirimFiyat(product.id, doctor.id, tx);
        if (fiyat.durum === "HATA") {
          hatalar.push(sert("FIYAT_COZUMLENEMEDI", { urun: product.name }));
          continue;
        }

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
      if (hatalar.length > 0) throw new IsHatasi(hatalar);

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

      await createAuditLog(
        {
          actorId: sellerId,
          action: AUDIT_ACTIONS.ORDER_CREATE,
          entityType: "Order",
          entityId: order.id,
          after: { documentNo, doctorId, doctorName: doctor.fullName, itemCount: lines.length },
        },
        tx
      );
    });
  } catch (e) {
    // Yalnız iş hatası sonuca döner; teknik hata hata sınırına düşer (X-3 §(2)/(4), X-4 §(2)).
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
