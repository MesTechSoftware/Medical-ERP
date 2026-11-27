import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { sevkiyatTakipDuzelt } from "@/lib/sevkiyat-duzelt";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// Sevkiyat takip/irsaliye düzeltme — KABUL_KRITERLERI D-3-3 (Ü-42 M4).

let no = 0;

async function kurulum() {
  no += 1;
  const y = await prisma.user.create({ data: { name: "Yönetici", email: `y${no}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
  const firmaA = await prisma.carrier.create({ data: { name: `Firma A ${no}` } });
  const firmaB = await prisma.carrier.create({ data: { name: `Firma B ${no}` } });
  const pasif = await prisma.carrier.create({ data: { name: `Pasif ${no}`, isActive: false } });
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  const s = await prisma.order.create({ data: { documentNo: `SIP-TD-${no}`, doctorId: d.id, paymentTermDays: 30, stage: "ONAYLI", status: "KARGOLANDI" } });
  const v = await prisma.shipment.create({
    data: { documentNo: `SVK-TD-${no}`, orderId: s.id, carrierId: firmaA.id, trackingNumber: "T-1", externalDispatchNo: "IRS-1", shippedAt: new Date("2026-10-01T09:00:00Z"), status: "KARGOLANDI" },
  });
  return { y, firmaA, firmaB, pasif, s, v };
}

const duzelt = (k: Awaited<ReturnType<typeof kurulum>>, g: { carrierId?: string | null; trackingNumber?: string | null; externalDispatchNo?: string | null }) =>
  prisma.$transaction((tx) =>
    sevkiyatTakipDuzelt(tx, {
      sevkiyatId: k.v.id,
      carrierId: g.carrierId === undefined ? k.firmaA.id : g.carrierId,
      trackingNumber: g.trackingNumber === undefined ? "T-1" : g.trackingNumber,
      externalDispatchNo: g.externalDispatchNo === undefined ? "IRS-1" : g.externalDispatchNo,
      yapanId: k.y.id,
    })
  );

describe("sevkiyatTakipDuzelt (D-3-3)", () => {
  it("yalnız üç alanı değiştirir; durum, gönderi tarihi, stok ve cari hareket sabit; denetim before/after/changes ile yazılır", async () => {
    const k = await kurulum();
    const stokOnce = await prisma.stockMovement.count();
    const cariOnce = await prisma.ledgerEntry.count();
    const r = await duzelt(k, { carrierId: k.firmaB.id, trackingNumber: "T-2", externalDispatchNo: "IRS-2" });
    expect(r).toEqual({ durum: "DEGISTI", siparisId: k.s.id });
    const v = await prisma.shipment.findUniqueOrThrow({ where: { id: k.v.id } });
    expect([v.carrierId, v.trackingNumber, v.externalDispatchNo]).toEqual([k.firmaB.id, "T-2", "IRS-2"]);
    expect(v.status).toBe("KARGOLANDI");
    expect(v.shippedAt).toEqual(k.v.shippedAt);
    expect(await prisma.stockMovement.count()).toBe(stokOnce);
    expect(await prisma.ledgerEntry.count()).toBe(cariOnce);
    const log = await prisma.auditLog.findMany({ where: { entityId: k.v.id, action: "SHIPMENT_TRACKING_UPDATE" } });
    expect(log).toHaveLength(1);
    expect(JSON.parse(log[0].beforeData!)).toMatchObject({ carrierId: k.firmaA.id, trackingNumber: "T-1", externalDispatchNo: "IRS-1" });
    expect(JSON.parse(log[0].afterData!)).toMatchObject({ carrierId: k.firmaB.id, trackingNumber: "T-2", externalDispatchNo: "IRS-2" });
    expect(log[0].changes).toBeTruthy();
  });

  it("değişiklik yoksa kayıt yazılmaz", async () => {
    const k = await kurulum();
    expect(await duzelt(k, {})).toEqual({ durum: "DEGISIKLIK_YOK", siparisId: k.s.id });
    expect(await prisma.auditLog.count({ where: { entityId: k.v.id } })).toBe(0);
  });

  it("pasif firma reddedilir; sevkiyatta zaten kayıtlı pasif firma korunabilir", async () => {
    const k = await kurulum();
    expect(await duzelt(k, { carrierId: k.pasif.id })).toEqual({ durum: "HATA", kod: "KARGO_FIRMASI_GECERSIZ" });
    expect((await prisma.shipment.findUniqueOrThrow({ where: { id: k.v.id } })).carrierId).toBe(k.firmaA.id);
    await prisma.shipment.update({ where: { id: k.v.id }, data: { carrierId: k.pasif.id } });
    expect(await duzelt({ ...k, firmaA: k.pasif }, { carrierId: k.pasif.id, trackingNumber: "T-9" })).toMatchObject({ durum: "DEGISTI" });
  });

  it("irsaliye no 32 karakteri aşamaz; 32 geçer; boş metin null olur", async () => {
    const k = await kurulum();
    expect(await duzelt(k, { externalDispatchNo: "x".repeat(33) })).toEqual({ durum: "HATA", kod: "IRSALIYE_NO_UZUN" });
    expect(await duzelt(k, { externalDispatchNo: "x".repeat(32) })).toMatchObject({ durum: "DEGISTI" });
    expect(await duzelt(k, { externalDispatchNo: "x".repeat(32), trackingNumber: "  ", carrierId: "" })).toMatchObject({ durum: "DEGISTI" });
    const v = await prisma.shipment.findUniqueOrThrow({ where: { id: k.v.id } });
    expect([v.carrierId, v.trackingNumber]).toEqual([null, null]);
  });

  it("olmayan sevkiyat SEVKIYAT_BULUNAMADI döner", async () => {
    const k = await kurulum();
    const r = await prisma.$transaction((tx) => sevkiyatTakipDuzelt(tx, { sevkiyatId: "yok", carrierId: null, trackingNumber: null, externalDispatchNo: null, yapanId: k.y.id }));
    expect(r).toEqual({ durum: "HATA", kod: "SEVKIYAT_BULUNAMADI" });
  });
});
