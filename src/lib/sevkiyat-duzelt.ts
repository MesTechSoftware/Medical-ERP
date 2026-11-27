import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import type { KuralKodu } from "@/lib/sonuc";

/** C-1: müşterinin irsaliye no'su (`VarChar(32)`). */
export const IRSALIYE_SINIRI = 32;

export type TakipDuzeltmeGirdisi = {
  sevkiyatId: string;
  carrierId: string | null;
  trackingNumber: string | null;
  externalDispatchNo: string | null;
  yapanId: string;
};

export type TakipDuzeltmeSonucu = { durum: "DEGISTI"; siparisId: string } | { durum: "DEGISIKLIK_YOK"; siparisId: string } | { durum: "HATA"; kod: KuralKodu };

const bosuNullla = (v: string | null) => (v === null || v.trim() === "" ? null : v.trim());

/**
 * Sevkiyatın firma, takip no ve harici irsaliye no'sunu düzeltir (D-3-3, M4). Yalnız bu üç alan yazılır;
 * durum, gönderi tarihi, kalemler, stok ve cari hareket dokunulmaz. Sıra: mevcut değer → pasif firma reddi
 * (değişmeyen eski firma pasif olsa da geçer) → irsaliye ≤ 32 → fark yoksa hiçbir şey yazılmaz → `update` +
 * denetim kaydı (çağıranın transaction'ında). İş hataları atılmaz, `HATA` olarak döner.
 */
export async function sevkiyatTakipDuzelt(tx: Prisma.TransactionClient, g: TakipDuzeltmeGirdisi): Promise<TakipDuzeltmeSonucu> {
  const mevcut = await tx.shipment.findUnique({
    where: { id: g.sevkiyatId },
    select: { orderId: true, carrierId: true, trackingNumber: true, externalDispatchNo: true },
  });
  if (!mevcut) return { durum: "HATA", kod: "SEVKIYAT_BULUNAMADI" };

  const yeni = {
    carrierId: g.carrierId && g.carrierId.trim() !== "" ? g.carrierId : null,
    trackingNumber: bosuNullla(g.trackingNumber),
    externalDispatchNo: bosuNullla(g.externalDispatchNo),
  };
  if (yeni.carrierId && yeni.carrierId !== mevcut.carrierId) {
    const firma = await tx.carrier.findUnique({ where: { id: yeni.carrierId }, select: { isActive: true } });
    if (!firma || !firma.isActive) return { durum: "HATA", kod: "KARGO_FIRMASI_GECERSIZ" };
  }
  if (yeni.externalDispatchNo !== null && yeni.externalDispatchNo.length > IRSALIYE_SINIRI) return { durum: "HATA", kod: "IRSALIYE_NO_UZUN" };

  const once = { carrierId: mevcut.carrierId, trackingNumber: mevcut.trackingNumber, externalDispatchNo: mevcut.externalDispatchNo };
  if (once.carrierId === yeni.carrierId && once.trackingNumber === yeni.trackingNumber && once.externalDispatchNo === yeni.externalDispatchNo) {
    return { durum: "DEGISIKLIK_YOK", siparisId: mevcut.orderId };
  }

  await tx.shipment.update({ where: { id: g.sevkiyatId }, data: yeni });
  await createAuditLog(
    { actorId: g.yapanId, action: AUDIT_ACTIONS.SHIPMENT_TRACKING_UPDATE, entityType: "Shipment", entityId: g.sevkiyatId, before: once, after: yeni },
    tx
  );
  return { durum: "DEGISTI", siparisId: mevcut.orderId };
}
