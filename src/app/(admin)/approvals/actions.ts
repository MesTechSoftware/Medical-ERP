"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { blokKarariVer } from "@/lib/onay-blogu";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";

/**
 * Açık onay bloğuna karar (A-8): yalnız `YONETICI`; karar notu her durumda zorunlu.
 * `RED` sonuç doğuran adımı durdurur; açan yeni gerekçeyle yeniden onaya gönderebilir.
 */
export async function blokKarari(blokId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();

  const karar = formData.get("karar");
  const not = String(formData.get("not") ?? "").trim();
  if (karar !== "ONAY" && karar !== "RED") return engel("ALAN_ZORUNLU");
  if (not === "") return engel("GEREKCE_ZORUNLU", {}, "not");

  const yazildi = await prisma.$transaction((tx) => blokKarariVer(tx, { blokId, karar, not, yapanId: session.user.id }));
  if (!yazildi) return engel("ONAY_KARARI_VERILMIS");

  revalidatePath("/approvals");
  revalidatePath("/shipping");
  return basarili();
}
