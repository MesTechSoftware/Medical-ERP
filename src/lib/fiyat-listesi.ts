import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { sert, type Bildirim } from "@/lib/sonuc";
import { priceSchema, quantitySchema } from "@/lib/validation";

/**
 * Fiyat listesi satırı — liste ekranı ve `FIYAT_LISTESI` içe aktarımının tek tanımı (X-10 §(1)/(7),
 * X-16 §(1)/(12)). Faz 1'de satırlar süresizdir; B-5 çakışma yasağının fiilî karşılığı
 * (liste, ürün, `min_adet`) tekilliğidir.
 */
export type FiyatSatiriGirdisi = { priceListId: string; productId: string; minQuantity: string; listPrice: string };
export type DenetlenmisFiyatSatiri = { priceListId: string; productId: string; minQuantity: number; listPrice: Decimal };

/** Satır kuralları; yazmaz. `mevcutId`: aynı anahtarlı süresiz satır (ekran günceller, import reddeder). */
export async function fiyatSatiriDenetle(
  db: Prisma.TransactionClient,
  g: FiyatSatiriGirdisi
): Promise<{ hatalar: Bildirim[]; satir: DenetlenmisFiyatSatiri | null; mevcutId: string | null }> {
  const fiyat = priceSchema.safeParse(g.listPrice);
  const minAdet = quantitySchema.safeParse(/^\d+$/.test(g.minQuantity.trim()) ? parseInt(g.minQuantity.trim(), 10) : NaN);
  const hatalar: Bildirim[] = [];
  if (!g.productId) hatalar.push(sert("ALAN_ZORUNLU", {}, "productId"));
  if (!fiyat.success) hatalar.push(sert("GECERSIZ_TUTAR", {}, "listPrice"));
  if (!minAdet.success) hatalar.push(sert("GECERSIZ_MIKTAR", {}, "minQuantity"));
  const [liste, urun] = await Promise.all([
    g.priceListId ? db.priceList.findUnique({ where: { id: g.priceListId }, select: { id: true } }) : null,
    g.productId ? db.product.findUnique({ where: { id: g.productId }, select: { id: true } }) : null,
  ]);
  if (!liste) hatalar.push(sert("FIYAT_LISTESI_BULUNAMADI", {}, "priceListId"));
  if (g.productId && !urun) hatalar.push(sert("URUN_BULUNAMADI", {}, "productId"));
  if (hatalar.length > 0 || !fiyat.success || !minAdet.success) return { hatalar, satir: null, mevcutId: null };

  const satir = { priceListId: g.priceListId, productId: g.productId, minQuantity: minAdet.data, listPrice: fiyat.data };
  const mevcut = await db.priceListItem.findFirst({
    where: { priceListId: satir.priceListId, productId: satir.productId, minQuantity: satir.minQuantity, validFrom: null, validTo: null },
    select: { id: true },
  });
  return { hatalar, satir, mevcutId: mevcut?.id ?? null };
}

/** Yazar (yoksa açar, `mevcutId` verilirse günceller) ve denetim kaydına yazar (RULE-13). */
export async function fiyatSatiriYaz(
  tx: Prisma.TransactionClient,
  s: DenetlenmisFiyatSatiri,
  yapan: { id: string; mevcutId?: string | null; partiId?: string }
): Promise<void> {
  const once = yapan.mevcutId ? await tx.priceListItem.findUniqueOrThrow({ where: { id: yapan.mevcutId } }) : null;
  const yazilan = once
    ? await tx.priceListItem.update({ where: { id: once.id }, data: { listPrice: s.listPrice } })
    : await tx.priceListItem.create({ data: { ...s, validFrom: null, validTo: null, importBatchId: yapan.partiId ?? null } });
  await createAuditLog(
    {
      actorId: yapan.id,
      action: AUDIT_ACTIONS.PRICE_LIST_ITEM_SET,
      entityType: "PriceList",
      entityId: s.priceListId,
      before: once ? { productId: s.productId, minQuantity: s.minQuantity, listPrice: once.listPrice.toFixed(4) } : undefined,
      after: { itemId: yazilan.id, productId: s.productId, minQuantity: s.minQuantity, listPrice: s.listPrice.toFixed(4) },
    },
    tx
  );
}
