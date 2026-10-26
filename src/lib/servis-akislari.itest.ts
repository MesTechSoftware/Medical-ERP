import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { siparisiHazirla, teslimEdildiIsaretle } from "@/lib/siparis-durum";
import { hesaplaStok } from "@/lib/stok";
import { stokGirisiYaz } from "@/lib/stok-giris";
import { tahsilatYaz } from "@/lib/tahsilat";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Ekran eylemlerinden çıkarılan servisler (tasarım 2-7a): eylem ve demo geçmiş seed'i aynı yolu
// kullanır. Eylem düzeyindeki davranış kendi testlerinde (collections.itest.ts, e2e) kalır.

async function yonetici() {
  return prisma.user.create({ data: { name: "Yönetici", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
}

async function siparis(status: "BEKLIYOR" | "KARGOLANDI") {
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  return prisma.order.create({
    data: { documentNo: `SIP-S-${status}`, doctorId: d.id, paymentTermDays: 30, stage: "ONAYLI", status },
  });
}

describe("tahsilatYaz — tahsilat akışının tek yazım yolu", () => {
  it("numara, kayıt, cari hareket ve denetim kaydı çağıranın transaction'ında", async () => {
    const { havale } = await referansVeri();
    const y = await yonetici();
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const odeme = await prisma.$transaction((tx) =>
      tahsilatYaz(tx, {
        doktorId: d.id,
        odemeYontemiId: havale.id,
        tutar: new Decimal("250.00"),
        odemeAni: new Date("2026-10-05T09:00:00Z"),
        referansNo: "R-1",
        not: null,
        yapanId: y.id,
      })
    );
    expect(odeme.documentNo).toMatch(/^THS-\d{4}-\d{6}$/);
    expect(odeme.paidAt.toISOString()).toBe("2026-10-05T09:00:00.000Z");
    const hareket = await prisma.ledgerEntry.findFirstOrThrow({ where: { paymentId: odeme.id } });
    expect([hareket.type, hareket.direction, hareket.amount.toFixed(2), hareket.documentNo]).toEqual([
      "TAHSILAT",
      "ALACAK",
      "250.00",
      odeme.documentNo,
    ]);
    expect(await prisma.auditLog.count({ where: { action: "COLLECTION_CREATE", entityId: odeme.id } })).toBe(1);
  });

  it("pasif ödeme yöntemi iş hatasıdır; transaction geri alınır, kayıt yazılmaz", async () => {
    const { havale } = await referansVeri();
    const y = await yonetici();
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    await prisma.paymentMethod.update({ where: { id: havale.id }, data: { isActive: false } });
    const girdi = { doktorId: d.id, odemeYontemiId: havale.id, tutar: new Decimal("10"), odemeAni: new Date(), referansNo: null, not: null, yapanId: y.id };
    await expect(prisma.$transaction((tx) => tahsilatYaz(tx, girdi))).rejects.toBeInstanceOf(IsHatasi);
    expect(await prisma.doctorPayment.count()).toBe(0);
  });
});

describe("siparisiHazirla / teslimEdildiIsaretle — koşullu durum geçişi", () => {
  it("BEKLIYOR → HAZIRLANIYOR bir kez geçer; ikinci deneme false döner, ikinci denetim kaydı yazılmaz", async () => {
    const y = await yonetici();
    const s = await siparis("BEKLIYOR");
    expect(await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: s.id, yapanId: y.id }))).toBe(true);
    expect(await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: s.id, yapanId: y.id }))).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("HAZIRLANIYOR");
    expect(await prisma.auditLog.count({ where: { action: "ORDER_STATUS_CHANGE", entityId: s.id } })).toBe(1);
  });

  it("teslim: siparişin sevkiyatları da TESLIM_EDILDI olur; KARGOLANDI değilse false", async () => {
    const y = await yonetici();
    const s = await siparis("KARGOLANDI");
    await prisma.shipment.create({ data: { documentNo: "SVK-S-1", orderId: s.id, status: "KARGOLANDI", shippedAt: new Date() } });
    expect(await prisma.$transaction((tx) => teslimEdildiIsaretle(tx, { siparisId: s.id, yapanId: y.id }))).toBe(true);
    expect((await prisma.shipment.findFirstOrThrow({ where: { orderId: s.id } })).status).toBe("TESLIM_EDILDI");
    expect(await prisma.$transaction((tx) => teslimEdildiIsaretle(tx, { siparisId: s.id, yapanId: y.id }))).toBe(false);
  });
});

describe("stokGirisiYaz — depoya giriş", () => {
  it("GIRIS hareketi yazar, stok hareketten türer; denetim kaydı yeni stokla", async () => {
    const { kdv20, depo } = await referansVeri();
    const y = await yonetici();
    const urun = await prisma.product.create({ data: { name: "Eldiven", code: "E-1", taxRateId: kdv20.id } });
    await prisma.$transaction((tx) => stokGirisiYaz(tx, { urunId: urun.id, miktar: 40, not: null, yapanId: y.id }));
    const hareket = await prisma.stockMovement.findFirstOrThrow({ where: { productId: urun.id } });
    expect([hareket.type, hareket.quantity, hareket.locationId, hareket.note]).toEqual(["GIRIS", 40, depo.id, "Stok girişi"]);
    expect(await hesaplaStok(urun.id)).toBe(40);
    const kayit = await prisma.auditLog.findFirstOrThrow({ where: { action: "STOCK_ENTRY", entityId: urun.id } });
    expect(JSON.parse(kayit.afterData ?? "{}")).toMatchObject({ quantity: 40, newStock: 40 });
  });
});
