"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { priceSchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";
import { EntityStatus } from "@/generated/prisma/enums";
import { benzersizIhlali, IsHatasi } from "@/lib/hata";
import { urunAcmaDenetle, urunAcmaYaz, varsayilanListeFiyatiYaz } from "@/lib/urun";
import { engel, sonucOlustur, sert, type IslemSonucu } from "@/lib/sonuc";

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


export async function createProduct(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const initialStock = Math.max(0, parseInt(String(formData.get("initialStock") ?? ""), 10) || 0);

  try {
    await prisma.$transaction(async (tx) => {
      // Kural tek tanımdadır (`urun.ts`); `URUN` içe aktarımı aynı denetimden geçer (X-16 §(1)).
      const { hatalar, urun } = await urunAcmaDenetle(tx, {
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        taxRateId: String(formData.get("taxRateId") ?? "").trim(),
        listPrice: String(formData.get("listPrice") ?? ""),
        status: formData.get("status") === "PASIF" ? "PASIF" : "AKTIF",
      });
      if (!urun) throw new IsHatasi(hatalar);
      const p = await urunAcmaYaz(tx, urun, { id: session.user.id });
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
    });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    // Ürün kodu benzersizdir (yarış: DB kısıtı); teknik hata hata sınırına düşer (X-3 §(4)).
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
