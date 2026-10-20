import type { Prisma } from "@/generated/prisma/client";
import { uretBelgeNo } from "@/lib/belge-no";
import { iadeHareketiYaz } from "@/lib/cari-hareket";
import { IsHatasi } from "@/lib/hata";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { sert, type Bildirim } from "@/lib/sonuc";
import { stokHareketiYaz, stokKilitle, varsayilanDepoId } from "@/lib/stok";

/**
 * Mal iadesi — A-1. İade **ayrı belgedir** (`IAD`); sipariş ve sevkiyat değişmez. Satır sipariş
 * satırına referansla miktar taşır; iade edilebilir = sevk edilen − önceki iadeler.
 *
 * Tek transaction'da: ürün satırları kilitlenir (ADR-008 §(1): ürün → belge sayacı; eşzamanlı iki
 * iade ve iade × sevkiyat aynı satırda yarışmaz) → iade edilebilir miktar kilit altında okunur →
 * `IAD` numarası → belge ve satırlar (KDV oranı ve prim oranı donar) → depoya stok girişi →
 * `IADE` · `ALACAK` cari hareketi (`hesaplaSatirTutarlari()`).
 *
 * Prim oranı (A-1 eki 20.10.2026): satırın **en son sevkiyatının** donmuş oranı; ciro ve hakediş
 * iade tarihinde düşer (raporlar `sayilanBelgeler.iadeSatiri`). Bedelsiz satırın iadesi alacak
 * doğurmaz. İş kuralı ihlalinde `IsHatasi` fırlatır (X-4 §(2)).
 */
export type IadeGirdisi = {
  siparisId: string;
  kalemler: readonly { siparisKalemiId: string; miktar: number }[];
  sebep: string;
  yapanId: string;
};

export async function iadeYaz(
  tx: Prisma.TransactionClient,
  girdi: IadeGirdisi
): Promise<{ iadeId: string; documentNo: string }> {
  const hatalar: Bildirim[] = [];
  const sebep = girdi.sebep.trim();
  if (sebep === "") hatalar.push(sert("GEREKCE_ZORUNLU", {}, "reason"));
  // 0 iade edilmeyen kalemdir; tam sayı olmayan ya da negatif miktar reddedilir.
  const kalemler = girdi.kalemler.filter((k) => k.miktar !== 0);
  if (kalemler.length === 0 || kalemler.some((k) => !Number.isInteger(k.miktar) || k.miktar < 0)) {
    hatalar.push(sert("IADE_KALEMI_YOK"));
  }
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  const siparis = await tx.order.findUnique({
    where: { id: girdi.siparisId },
    select: { id: true, doctorId: true, items: { select: { productId: true } } },
  });
  if (!siparis) throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);

  await stokKilitle(tx, siparis.items.map((i) => i.productId));
  const satirlar = await tx.orderItem.findMany({
    where: { orderId: siparis.id },
    select: {
      id: true,
      productId: true,
      unitPrice: true,
      listPrice: true,
      vatRate: true,
      isFree: true,
      product: { select: { name: true } },
      shipmentItems: {
        select: { quantity: true, commissionRate: true },
        orderBy: [{ shipment: { createdAt: "desc" } }, { id: "desc" }], // [0] en son sevkiyat
      },
      returnItems: { select: { quantity: true } },
    },
  });
  const satir = new Map(
    satirlar.map((s) => [
      s.id,
      {
        ...s,
        iadeEdilebilir:
          s.shipmentItems.reduce((t, i) => t + i.quantity, 0) - s.returnItems.reduce((t, i) => t + i.quantity, 0),
      },
    ])
  );

  for (const k of kalemler) {
    const s = satir.get(k.siparisKalemiId);
    if (!s) hatalar.push(sert("IADE_KALEMI_YOK"));
    else if (k.miktar > s.iadeEdilebilir) {
      hatalar.push(sert("IADE_MIKTARI_ASILDI", { urun: s.product.name, kalan: s.iadeEdilebilir }));
    }
  }
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  const konumId = await varsayilanDepoId(tx);
  const documentNo = await uretBelgeNo("IAD", tx);
  const iade = await tx.returnNote.create({
    data: {
      documentNo,
      doctorId: siparis.doctorId,
      locationId: konumId,
      reason: sebep,
      createdById: girdi.yapanId,
      items: {
        create: kalemler.map((k) => {
          const s = satir.get(k.siparisKalemiId)!;
          return {
            orderItemId: s.id,
            quantity: k.miktar,
            vatRate: s.vatRate,
            commissionRate: s.shipmentItems[0].commissionRate,
          };
        }),
      },
    },
  });

  await stokHareketiYaz(
    tx,
    kalemler.map((k) => ({
      productId: satir.get(k.siparisKalemiId)!.productId,
      locationId: konumId,
      type: "GIRIS" as const,
      quantity: k.miktar,
      note: "İade girişi",
      returnNoteId: iade.id,
    }))
  );

  const { toplam } = hesaplaSatirTutarlari(
    kalemler.map((k) => {
      const s = satir.get(k.siparisKalemiId)!;
      return { birimFiyat: s.unitPrice, listeFiyat: s.listPrice, miktar: k.miktar, kdvOrani: s.vatRate, bedelsiz: s.isFree };
    })
  );
  if (toplam.toplam.gt(0)) {
    await iadeHareketiYaz(tx, {
      doctorId: siparis.doctorId,
      tutar: toplam.toplam,
      documentNo,
      returnNoteId: iade.id,
      yapanId: girdi.yapanId,
    });
  }
  return { iadeId: iade.id, documentNo };
}
