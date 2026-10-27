"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaff } from "@/lib/session";
import { quantitySchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";
import type { Prisma } from "@/generated/prisma/client";
import { IsHatasi } from "@/lib/hata";
import { konsinyeCikisYaz, stokTransferYaz } from "@/lib/stok-transfer";
import { stokDuzeltmeYaz, type DuzeltmeKalemi } from "@/lib/stok-duzeltme";
import { stokGirisiYaz } from "@/lib/stok-giris";

export async function addStockEntry(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireStaff();

  const productId = formData.get("productId") as string;
  const quantity = parseInt(String(formData.get("quantity") ?? ""), 10);
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!productId) return engel("ALAN_ZORUNLU", {}, "productId");
  if (!quantitySchema.safeParse(quantity).success) return engel("GECERSIZ_MIKTAR", {}, "quantity");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return engel("URUN_BULUNAMADI", {}, "productId");

  // Stok miktarı saklanmaz; giriş yalnız hareket yazar (ADR-005) — tek yol lib/stok-giris.ts.
  await prisma.$transaction((tx) => stokGirisiYaz(tx, { urunId: productId, miktar: quantity, not: note, yapanId: session.user.id }));

  revalidatePath("/stock");
  revalidatePath("/products");
  return basarili();
}

/** Tek satırlık konum belgesi formu: ürün + miktar (A-4, B-4). */
function kalem(formData: FormData) {
  const v = String(formData.get("quantity") ?? "").trim();
  return [{ urunId: String(formData.get("productId") ?? ""), miktar: /^\d+$/.test(v) ? parseInt(v, 10) : NaN }];
}

type Yapan = { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };

async function konumBelgesi(yaz: (tx: Prisma.TransactionClient) => Promise<{ documentNo: string }>): Promise<IslemSonucu> {
  try {
    const r = await prisma.$transaction(yaz);
    revalidatePath("/stock");
    revalidatePath("/products");
    return basarili({ documentNo: r.documentNo });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
}

/** Konsinye çıkış (A-4): depodan doktorun konsinye konumuna; mali sonucu yok. */
export async function addConsignment(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  const yapan: Yapan = { id: session.user.id, rol: session.user.role };
  return konumBelgesi((tx) =>
    konsinyeCikisYaz(tx, {
      doktorId: String(formData.get("doctorId") ?? ""),
      kalemler: kalem(formData),
      yapan,
      gerekce: (formData.get("gerekce") as string) || null,
    })
  );
}

/** Stok transferi (B-4): konumdan depoya; kullanılan konsinye mal böyle depoya alınır (A-4 eki). */
export async function addTransfer(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  const yapan: Yapan = { id: session.user.id, rol: session.user.role };
  return konumBelgesi((tx) =>
    stokTransferYaz(tx, {
      kaynakId: String(formData.get("fromLocationId") ?? ""),
      hedefId: String(formData.get("toLocationId") ?? ""),
      kalemler: kalem(formData),
      yapan,
      gerekce: (formData.get("gerekce") as string) || null,
    })
  );
}

/**
 * Stok düzeltme (B-7): yalnız YONETICI; satırlar JSON (`kalemler`), tutanak no salt kayıt. Yönetimsel
 * eylemin logu denetim kaydıdır (§(6)); belge tarihi kayıt anıdır (§(4)).
 */
export async function addStockAdjustment(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();

  let kalemler: DuzeltmeKalemi[];
  try {
    const ham: unknown = JSON.parse(String(formData.get("kalemler") ?? "[]"));
    if (!Array.isArray(ham)) return engel("DUZELTME_KALEMI_GECERSIZ");
    kalemler = ham.map((k: Record<string, unknown>) => ({
      urunId: String(k.urunId ?? ""),
      konumId: String(k.konumId ?? ""),
      fark: typeof k.fark === "number" ? k.fark : NaN,
      sebepId: String(k.sebepId ?? ""),
      aciklama: String(k.aciklama ?? ""),
    }));
  } catch (e) {
    if (e instanceof SyntaxError) return engel("DUZELTME_KALEMI_GECERSIZ");
    throw e;
  }

  const gerekce = (formData.get("gerekce") as string) || null;
  try {
    const r = await prisma.$transaction(async (tx) => {
      const belge = await stokDuzeltmeYaz(tx, {
        kalemler,
        hariciBelgeNo: (formData.get("externalDocNo") as string) || null,
        yapan: { id: session.user.id, rol: session.user.role },
        gerekce,
      });
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.STOCK_ADJUSTMENT,
          entityType: "StockAdjustment",
          entityId: belge.belgeId,
          after: { documentNo: belge.documentNo, kalemler },
          gerekce,
        },
        tx
      );
      return belge;
    });
    revalidatePath("/stock");
    revalidatePath("/products");
    return basarili({ documentNo: r.documentNo });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
}
