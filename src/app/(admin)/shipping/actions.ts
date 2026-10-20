"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { IsHatasi } from "@/lib/hata";
import { sevkiyatYaz } from "@/lib/sevkiyat";
import { onayaGonderildi, yumusak, type IslemSonucu } from "@/lib/sonuc";

const KALEM = "miktar_";

/**
 * HAZIRLANIYOR siparişin sevkiyatı (A-3): kalem başına sevk miktarı, kargo bilgisi ve
 * isteğe bağlı müşteri irsaliye numarası (C-1 §(2), salt kayıt). Borç, prim ve stok çıkışı
 * `sevkiyatYaz()`'da aynı transaction'da doğar. Bütün kalemler sevk edilince sipariş KARGOLANDI olur.
 * Negatif stokta gerekçe diyaloğu döner; yönetici dışındaki rolün gerekçesi siparişi onaya gönderir (A-8).
 */
export async function shipOrder(orderId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();

  const metin = (ad: string) => ((formData.get(ad) as string) || "").trim() || null;
  const kalemler = [...formData.keys()]
    .filter((k) => k.startsWith(KALEM))
    .map((k) => {
      const v = String(formData.get(k) ?? "").trim() || "0";
      // Tam sayı değilse NaN kalır ve servis reddeder; kesilip sessizce yuvarlanmaz.
      return { siparisKalemiId: k.slice(KALEM.length), miktar: /^\d+$/.test(v) ? parseInt(v, 10) : NaN };
    });

  let sonuc: Awaited<ReturnType<typeof sevkiyatYaz>>;
  try {
    sonuc = await prisma.$transaction(async (tx) => {
      const sevk = await sevkiyatYaz(tx, {
        siparisId: orderId,
        kalemler,
        carrierId: metin("carrierId"),
        trackingNumber: metin("trackingNumber"),
        externalDispatchNo: metin("externalDispatchNo"),
        yapan: { id: session.user.id, rol: session.user.role },
        gerekce: metin("gerekce"),
      });
      if (sevk.durum === "ONAYA_GONDERILDI") return sevk;
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
          entityType: "Order",
          entityId: orderId,
          after: { sevkiyat: sevk.documentNo, kalemler, tamamlandi: sevk.tamamlandi },
        },
        tx
      );
      return sevk;
    });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }

  if (sonuc.durum === "ONAYA_GONDERILDI") {
    revalidatePath("/shipping");
    revalidatePath("/approvals");
    return onayaGonderildi(sonuc.ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)));
  }

  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  redirect("/shipping");
}
