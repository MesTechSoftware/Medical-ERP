"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { priceSchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { policy } from "@/lib/policy";
import { stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";
import { EntityStatus } from "@/generated/prisma/enums";
import { benzersizIhlali } from "@/lib/hata";
import { engel, sonucOlustur, sert, type IslemSonucu } from "@/lib/sonuc";
import type { Prisma } from "@/generated/prisma/client";
import type Decimal from "decimal.js";

function parseProductForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const code = (formData.get("code") as string)?.trim();
  const taxRateId = (formData.get("taxRateId") as string)?.trim();
  // Fiyat NET (KDV hariç) girilir; kanonik değer nettir (FR-17, FR-19).
  const listPrice = priceSchema.safeParse(formData.get("listPrice") ?? "");
  const status: EntityStatus =
    formData.get("status") === "PASIF"
      ? EntityStatus.PASIF
      : EntityStatus.AKTIF;

  // Bütün alan hataları birlikte döner (X-4 §(7)).
  const hatalar = [
    ...(name ? [] : [sert("ALAN_ZORUNLU", {}, "name")]),
    ...(code ? [] : [sert("ALAN_ZORUNLU", {}, "code")]),
    ...(listPrice.success ? [] : [sert("GECERSIZ_TUTAR", {}, "listPrice")]),
    ...(taxRateId ? [] : [sert("ALAN_ZORUNLU", {}, "taxRateId")]),
  ];
  if (hatalar.length > 0 || !listPrice.success) return { hata: sonucOlustur(hatalar) };

  return { data: { name, code, taxRateId, status }, listPrice: listPrice.data };
}

/**
 * Ürünün liste fiyatı ürün tablosunda değil, VARSAYILAN LİSTENİN satırındadır
 * (X-10 §(5), GÇ-15). Liste ekranı 1B madde 7'ye kadar ürün formu bu satırı yazar
 * (FAZ1 §D.1 not 3). Tarih alanları boş (süresiz) kalır (X-10 §(7)).
 */
async function varsayilanListeFiyatiYaz(
  tx: Prisma.TransactionClient,
  productId: string,
  listPrice: Decimal
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
  if (satir) {
    await tx.priceListItem.update({ where: { id: satir.id }, data: { listPrice } });
  } else {
    await tx.priceListItem.create({ data: { priceListId: liste.id, productId, listPrice } });
  }
}

export async function createProduct(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.hata) return parsed.hata;

  const initialStock = Math.max(0, parseInt(String(formData.get("initialStock") ?? ""), 10) || 0);

  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data: parsed.data });
      await varsayilanListeFiyatiYaz(tx, p.id, parsed.listPrice);
      // Başlangıç stoğu varsa hareket kaydı oluştur (stok miktarı saklanmaz — ADR-005).
      if (initialStock > 0) {
        await stokHareketiYaz(tx, [
          {
            productId: p.id,
            locationId: await varsayilanDepoId(tx),
            type: "GIRIS",
            quantity: initialStock,
            note: "Başlangıç stok girişi",
          },
        ]);
      }
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.PRODUCT_CREATE,
          entityType: "Product",
          entityId: p.id,
          after: { ...p, listPrice: parsed.listPrice },
        },
        tx
      );
    });
  } catch (e) {
    // Ürün kodu benzersizdir; teknik hata hata sınırına düşer (X-3 §(4)).
    if (benzersizIhlali(e)) return engel("URUN_KODU_KAYITLI", {}, "code");
    throw e;
  }

  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/products");
}

export async function updateProduct(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);
  if (parsed.hata) return parsed.hata;

  const before = await prisma.product.findUnique({ where: { id } });

  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({ where: { id }, data: parsed.data });
      await varsayilanListeFiyatiYaz(tx, id, parsed.listPrice);
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.PRODUCT_UPDATE,
          entityType: "Product",
          entityId: id,
          before,
          after: { ...p, listPrice: parsed.listPrice },
        },
        tx
      );
    });
  } catch (e) {
    if (benzersizIhlali(e)) return engel("URUN_KODU_KAYITLI", {}, "code");
    throw e;
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string): Promise<IslemSonucu> {
  await requireAdmin();
  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) return engel("URUN_SIPARISTE_KULLANILDI");
  await prisma.stockMovement.deleteMany({ where: { productId: id } });
  await prisma.priceListItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  redirect("/products");
}
