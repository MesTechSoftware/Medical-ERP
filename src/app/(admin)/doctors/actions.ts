"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";

/**
 * FR-06 / X-13 §(5): yönetici doktorları başka satıcıya devreder; gerekçe zorunlu, iz tutulur.
 * FR-07: geçmiş siparişler ESKİ satıcıda kalır — `Order.sellerId`'ye dokunulmaz.
 * Toplu devir (X-17 §(4)): cari listesinden çoklu seçim, gerekçe bir kez. Sahiplik, izi ve
 * denetim kaydı `degistirDoktorSahibi()` ile aynı transaction'da yazılır (X-17 §(1)/(3)).
 */
export async function transferDoctor(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();

  const doctorIds = formData.getAll("doctorId").map((v) => String(v).trim()).filter(Boolean);
  const newSellerId = (formData.get("sellerId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim();

  if (doctorIds.length === 0) return engel("DEVIR_DOKTOR_SECILMEDI");
  if (!reason) return engel("GEREKCE_ZORUNLU", {}, "reason");

  // Boş seçim = sahipsiz bırak (X-17 §(5)).
  const targetSellerId = newSellerId || null;

  const sonuc = await prisma.$transaction((tx) =>
    degistirDoktorSahibi(doctorIds, targetSellerId, { metin: reason, yapanId: session.user.id }, tx)
  );
  if (sonuc.durum === "HATA") return engel(sonuc.kuralKodu, {}, "sellerId");
  if (sonuc.degisen === 0) return engel("DEVIR_DEGISIKLIK_YOK");

  revalidatePath("/doctors");
  return basarili({ degisen: sonuc.degisen });
}
