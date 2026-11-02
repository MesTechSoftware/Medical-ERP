"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { benzersizIhlali, IsHatasi } from "@/lib/hata";
import { fiyatSatiriDenetle, fiyatSatiriYaz } from "@/lib/fiyat-listesi";
import { basarili, engel, sert, sonucOlustur, type Bildirim, type IslemSonucu } from "@/lib/sonuc";

/**
 * Fiyat listesi ekranı (X-10 §(1)/(6)/(7)): başlık ve satırlar (fiyat, `min_adet`). Liste satırı
 * yazmak fiyat tanımıdır → yalnız `YONETICI`; her yazım denetim kaydındadır (RULE-13). Tarih
 * alanlarının ekranı Faz 2'dir: ekran satırı süresiz yazar; tarihli satır (import) salt okunur.
 * Sipariş satırı çözümlenen fiyatı dondurduğu için (B-6, RULE-04) satır değişikliği geçmişe dokunmaz.
 */

const KOD = /^[A-Z0-9_-]{2,32}$/;

export async function createPriceList(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const hatalar: Bildirim[] = [];
  if (!KOD.test(code)) hatalar.push(sert("FIYAT_LISTESI_KODU_GECERSIZ", {}, "code"));
  if (!name) hatalar.push(sert("ALAN_ZORUNLU", {}, "name"));
  if (hatalar.length > 0) return sonucOlustur(hatalar);

  let id: string;
  try {
    id = await prisma.$transaction(async (tx) => {
      const liste = await tx.priceList.create({ data: { code, name } });
      await createAuditLog(
        { actorId: session.user.id, action: AUDIT_ACTIONS.PRICE_LIST_CREATE, entityType: "PriceList", entityId: liste.id, after: { code, name } },
        tx
      );
      return liste.id;
    });
  } catch (e) {
    if (benzersizIhlali(e)) return engel("FIYAT_LISTESI_KODU_KAYITLI", {}, "code");
    throw e;
  }
  revalidatePath("/price-lists");
  // Yeni listede sıradaki iş satır eklemektir (spec Ü-21 §3.7).
  redirect(`/price-lists/${id}`);
}

/**
 * Satır yazar ya da günceller: aynı liste + ürün + `min_adet` için süresiz satır tektir (B-5 çakışma
 * yasağı DB'de). Barem `min_adet` alt sınırıdır (B-6).
 */
export async function setPriceListItem(priceListId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      // Kural tek tanımdadır (`fiyat-listesi.ts`); `FIYAT_LISTESI` içe aktarımı aynı denetimden geçer.
      const { hatalar, satir, mevcutId } = await fiyatSatiriDenetle(tx, {
        priceListId,
        productId: String(formData.get("productId") ?? ""),
        minQuantity: String(formData.get("minQuantity") ?? "1"),
        listPrice: String(formData.get("listPrice") ?? ""),
      });
      if (!satir) throw new IsHatasi(hatalar);
      await fiyatSatiriYaz(tx, satir, { id: session.user.id, mevcutId });
    });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
  revalidatePath(`/price-lists/${priceListId}`);
  revalidatePath("/price-lists");
  return basarili();
}

/** Satırı kaldırır (ör. barem kaldırma). Tanım verisidir; siparişler fiyatı dondurmuştur. */
export async function deletePriceListItem(itemId: string): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const satir = await prisma.priceListItem.findUnique({ where: { id: itemId } });
  if (!satir) return engel("FIYAT_LISTESI_BULUNAMADI");
  await prisma.$transaction(async (tx) => {
    await tx.priceListItem.delete({ where: { id: itemId } });
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.PRICE_LIST_ITEM_DELETE,
        entityType: "PriceList",
        entityId: satir.priceListId,
        before: { itemId, productId: satir.productId, minQuantity: satir.minQuantity, listPrice: satir.listPrice.toFixed(4) },
      },
      tx
    );
  });
  revalidatePath(`/price-lists/${satir.priceListId}`);
  revalidatePath("/price-lists");
  return basarili();
}
