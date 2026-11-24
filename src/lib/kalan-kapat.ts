import type { Prisma } from "@/generated/prisma/client";
import { CloseReason } from "@/generated/prisma/enums";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { IsHatasi } from "@/lib/hata";
import { sert } from "@/lib/sonuc";
import { kalanMiktar } from "@/lib/siparis";
import { stokKilitle } from "@/lib/stok";

/**
 * Kalanı kapat — A-3 eki. Kısmen sevk edilmiş bir siparişin sevk edilmeyecek miktarını kapatır:
 * kalem başına `closedQuantity` kalanı kadar artar, sipariş `KARGOLANDI`'ya geçer. **Kalem kapatma
 * (tahsilat-borç eşleştirmesi, X-6) değildir**; yalnız açık sipariş miktarını düşürür. Onay bloğu açmaz.
 *
 * Eşzamanlılık (ADR-012): sevkiyatın kilitlediği ürün satırları kilitlenir; `Order` satırı kilitlenmez.
 * Durum kilit altında okunur ve yazım `status = HAZIRLANIYOR` koşulludur — eşzamanlı sevkiyat ve
 * kapatmadan yalnız biri başarılı olur.
 */
export type KapatmaGirdisi = {
  siparisId: string;
  gerekce: string;
  not: string | null;
  yapanId: string;
};

const NOT_UZUNLUGU = 200;

export async function kalaniKapat(tx: Prisma.TransactionClient, g: KapatmaGirdisi): Promise<{ kapatilan: number }> {
  if (!(Object.values(CloseReason) as string[]).includes(g.gerekce)) throw new IsHatasi([sert("GEREKCE_ZORUNLU", {}, "closeReason")]);
  const gerekce = g.gerekce as CloseReason;
  const not = (g.not ?? "").trim().slice(0, NOT_UZUNLUGU);
  if (gerekce === "DIGER" && not === "") throw new IsHatasi([sert("ALAN_ZORUNLU", {}, "closeNote")]);

  const siparis = await tx.order.findUnique({ where: { id: g.siparisId }, select: { id: true, items: { select: { productId: true } } } });
  if (!siparis) throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);

  await stokKilitle(tx, siparis.items.map((i) => i.productId));
  const durum = await tx.order.findUniqueOrThrow({
    where: { id: siparis.id },
    select: { stage: true, status: true, _count: { select: { shipments: true } } },
  });
  if (durum.stage !== "ONAYLI" || durum.status !== "HAZIRLANIYOR" || durum._count.shipments === 0) {
    throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);
  }

  const kalemler = await tx.orderItem.findMany({
    where: { orderId: siparis.id },
    select: { id: true, quantity: true, closedQuantity: true, shipmentItems: { select: { quantity: true } } },
  });
  const kapatilacak = kalemler.map((k) => ({ id: k.id, kalan: kalanMiktar(k) })).filter((k) => k.kalan > 0);
  if (kapatilacak.length === 0) throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);

  const res = await tx.order.updateMany({
    where: { id: siparis.id, status: "HAZIRLANIYOR" },
    data: { status: "KARGOLANDI", closedAt: new Date(), closedById: g.yapanId, closeReason: gerekce, closeNote: not || null },
  });
  if (res.count === 0) throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);
  for (const k of kapatilacak) {
    await tx.orderItem.update({ where: { id: k.id }, data: { closedQuantity: { increment: k.kalan } } });
  }

  const kapatilan = kapatilacak.reduce((t, k) => t + k.kalan, 0);
  await createAuditLog(
    {
      actorId: g.yapanId,
      action: AUDIT_ACTIONS.ORDER_REMAINDER_CLOSE,
      entityType: "Order",
      entityId: siparis.id,
      before: { status: "HAZIRLANIYOR" },
      after: { status: "KARGOLANDI", gerekce, not: not || null, kalemler: kapatilacak.map((k) => ({ id: k.id, kapatilan: k.kalan })) },
    },
    tx
  );
  return { kapatilan };
}
