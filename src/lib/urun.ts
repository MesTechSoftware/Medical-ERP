import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { policy } from "@/lib/policy";
import { sert, type Bildirim } from "@/lib/sonuc";
import { priceSchema } from "@/lib/validation";

/**
 * Ürün açma — ürün ekranı ve `URUN` içe aktarımının tek tanımı (X-16 §(1), ADR-006). Ürünün liste
 * fiyatı ürün tablosunda değil **varsayılan listenin** 1 adetlik süresiz satırındadır (X-10 §(5)).
 */
export type UrunGirdisi = {
  name: string;
  code: string;
  taxRateId: string;
  listPrice: string;
  status: "AKTIF" | "PASIF";
};

export type DenetlenmisUrun = {
  veri: { name: string; code: string; taxRateId: string; status: "AKTIF" | "PASIF" };
  listeFiyati: Decimal;
};

/** Satır kuralları; yazmaz. Ürün kodu tekildir (`URUN_KODU_KAYITLI`); dosya içi tekillik import'un küme kuralıdır. */
export async function urunAcmaDenetle(
  db: Prisma.TransactionClient,
  g: UrunGirdisi,
  haricId?: string
): Promise<{ hatalar: Bildirim[]; urun: DenetlenmisUrun | null }> {
  const name = g.name.trim();
  const code = g.code.trim();
  const fiyat = priceSchema.safeParse(g.listPrice);
  const hatalar: Bildirim[] = [
    ...(name ? [] : [sert("ALAN_ZORUNLU", {}, "name")]),
    ...(code ? [] : [sert("ALAN_ZORUNLU", {}, "code")]),
    ...(fiyat.success ? [] : [sert("GECERSIZ_TUTAR", {}, "listPrice")]),
    ...(g.taxRateId ? [] : [sert("ALAN_ZORUNLU", {}, "taxRateId")]),
  ];
  if (g.taxRateId && !(await db.taxRate.findUnique({ where: { id: g.taxRateId }, select: { id: true } }))) {
    hatalar.push(sert("VERGI_ORANI_BULUNAMADI", {}, "taxRateId"));
  }
  if (code) {
    const ayni = await db.product.findUnique({ where: { code }, select: { id: true } });
    if (ayni && ayni.id !== haricId) hatalar.push(sert("URUN_KODU_KAYITLI", {}, "code"));
  }
  if (hatalar.length > 0 || !fiyat.success) return { hatalar, urun: null };
  return { hatalar, urun: { veri: { name, code, taxRateId: g.taxRateId, status: g.status }, listeFiyati: fiyat.data } };
}

/** Varsayılan listenin 1 adetlik süresiz satırını yazar ya da günceller (X-10 §(5)). */
export async function varsayilanListeFiyatiYaz(
  tx: Prisma.TransactionClient,
  productId: string,
  listPrice: Decimal,
  partiId?: string
) {
  const liste = await tx.priceList.findUnique({
    where: { code: policy.pricing.varsayilanFiyatListesiKodu },
    select: { id: true },
  });
  if (!liste) throw new Error("Varsayılan fiyat listesi tanımlı değil.");
  const satir = await tx.priceListItem.findFirst({
    where: { priceListId: liste.id, productId, minQuantity: 1, validFrom: null, validTo: null },
    select: { id: true },
  });
  if (satir) await tx.priceListItem.update({ where: { id: satir.id }, data: { listPrice } });
  else await tx.priceListItem.create({ data: { priceListId: liste.id, productId, listPrice, importBatchId: partiId ?? null } });
}

export async function urunAcmaYaz(
  tx: Prisma.TransactionClient,
  u: DenetlenmisUrun,
  yapan: { id: string; partiId?: string }
): Promise<{ id: string }> {
  const p = await tx.product.create({ data: { ...u.veri, importBatchId: yapan.partiId ?? null } });
  await varsayilanListeFiyatiYaz(tx, p.id, u.listeFiyati, yapan.partiId);
  await createAuditLog(
    { actorId: yapan.id, action: AUDIT_ACTIONS.PRODUCT_CREATE, entityType: "Product", entityId: p.id, after: { ...p, listPrice: u.listeFiyati } },
    tx
  );
  return { id: p.id };
}
