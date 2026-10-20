import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Sayılan belgeler filtresi — KABUL_KRITERLERI A-5-1…A-5-5. Her dışlama gerçek
// veritabanında, filtrenin kendisiyle sorgulanarak doğrulanır.

async function hazirlik() {
  const ref = await referansVeri();
  const yonetici = await prisma.user.create({
    data: { name: "Yön", email: "yon@medikal.local", passwordHash: "x", role: "YONETICI" },
  });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  const urun = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: ref.kdv20.id } });
  return { ...ref, yonetici, doktor, urun };
}

let no = 0;
async function siparis(
  h: Awaited<ReturnType<typeof hazirlik>>,
  stage: "TEKLIF" | "ONAYLI",
  status: "BEKLIYOR" | "IPTAL" = "BEKLIYOR"
) {
  no += 1;
  return prisma.order.create({
    data: {
      documentNo: `SIP-F-${no}`,
      doctorId: h.doktor.id,
      paymentTermDays: 30,
      stage,
      status,
      items: {
        create: [
          { productId: h.urun.id, quantity: 5, listPrice: "100", unitPrice: "100", vatRate: "20" },
          { productId: h.urun.id, quantity: 1, listPrice: "100", unitPrice: "100", vatRate: "20", isFree: true, freeReason: "NUMUNE" },
        ],
      },
    },
    include: { items: true },
  });
}

async function sevkEt(order: Awaited<ReturnType<typeof siparis>>) {
  no += 1;
  return prisma.shipment.create({
    data: {
      documentNo: `SVK-F-${no}`,
      orderId: order.id,
      items: { create: order.items.map((i) => ({ orderItemId: i.id, quantity: i.quantity })) },
    },
  });
}

const sayilanSiparisNolari = async () =>
  (await prisma.order.findMany({ where: sayilanBelgeler.siparis, select: { documentNo: true } }))
    .map((o) => o.documentNo)
    .sort();

describe("sayılan belgeler filtresi — sipariş (A-5-1, A-5-2)", () => {
  it("yalnız ONAYLI ve iptal edilmemiş sipariş sayılır", async () => {
    const h = await hazirlik();
    const teklif = await siparis(h, "TEKLIF");
    const onayli = await siparis(h, "ONAYLI");
    const iptal = await siparis(h, "ONAYLI", "IPTAL");

    const sayilan = await sayilanSiparisNolari();
    expect(sayilan).toEqual([onayli.documentNo]);
    expect(sayilan).not.toContain(teklif.documentNo);
    expect(sayilan).not.toContain(iptal.documentNo);
  });
});

describe("sayılan belgeler filtresi — sevk satırı (A-5-1, A-5-3)", () => {
  it("TEKLIF siparişin sevk satırı ve bedelsiz satır sayılmaz", async () => {
    const h = await hazirlik();
    const onayli = await siparis(h, "ONAYLI");
    const teklif = await siparis(h, "TEKLIF");
    await sevkEt(onayli);
    await sevkEt(teklif);

    const satirlar = await prisma.shipmentItem.findMany({
      where: sayilanBelgeler.sevkSatiri,
      select: { quantity: true, orderItem: { select: { isFree: true, orderId: true } } },
    });
    expect(satirlar).toHaveLength(1);
    expect(satirlar[0]).toEqual({ quantity: 5, orderItem: { isFree: false, orderId: onayli.id } });
    // Kıyas: filtresiz dört satır vardır.
    expect(await prisma.shipmentItem.count()).toBe(4);
  });
});

describe("sayılan belgeler filtresi — cari hareket (A-5-4)", () => {
  it("ACILIS ve VADE_FARKI sayılmaz; diğer tipler sayılır", async () => {
    const h = await hazirlik();
    const hareket = (type: "SEVKIYAT" | "IADE" | "TAHSILAT" | "ACILIS" | "VADE_FARKI" | "TERS_KAYIT", documentNo: string) => ({
      doctorId: h.doktor.id,
      type,
      direction: type === "TAHSILAT" || type === "IADE" ? ("ALACAK" as const) : ("BORC" as const),
      amount: "10",
      documentNo,
      createdById: h.yonetici.id,
    });
    await prisma.ledgerEntry.createMany({
      data: [
        hareket("SEVKIYAT", "SVK-1"),
        hareket("IADE", "IAD-1"),
        hareket("TAHSILAT", "THS-1"),
        hareket("ACILIS", "ACL-1"),
        hareket("VADE_FARKI", "VDF-1"),
        hareket("TERS_KAYIT", "SVK-1"),
      ],
    });

    const tipler = (await prisma.ledgerEntry.findMany({ where: sayilanBelgeler.cariHareket, select: { type: true } }))
      .map((r) => r.type)
      .sort();
    expect(tipler).toEqual(["IADE", "SEVKIYAT", "TAHSILAT", "TERS_KAYIT"]);
  });
});

describe("sayılan belgeler filtresi — stok hareketi (A-5-5)", () => {
  it("konsinye çıkış, transfer ve düzeltme hareketleri sayılmaz; sevkiyat hareketi sayılır", async () => {
    const h = await hazirlik();
    const konsinye = await prisma.stockLocation.create({ data: { code: "KNS-DR", name: "Dr. konsinye", type: "KONSINYE", doctorId: h.doktor.id } });
    const onayli = await siparis(h, "ONAYLI");
    const sevk = await sevkEt(onayli);
    const kns = await prisma.consignmentIssue.create({
      data: { documentNo: "KNS-1", doctorId: h.doktor.id, fromLocationId: h.depo.id, toLocationId: konsinye.id, createdById: h.yonetici.id },
    });
    const trf = await prisma.stockTransfer.create({
      data: { documentNo: "TRF-1", fromLocationId: konsinye.id, toLocationId: h.depo.id, createdById: h.yonetici.id },
    });
    const dzl = await prisma.stockAdjustment.create({ data: { documentNo: "DZL-1", createdById: h.yonetici.id } });

    const hareket = (note: string, bag: Record<string, string>) => ({
      productId: h.urun.id,
      locationId: h.depo.id,
      type: "CIKIS" as const,
      quantity: 1,
      note,
      ...bag,
    });
    await prisma.stockMovement.createMany({
      data: [
        hareket("sevkiyat", { shipmentId: sevk.id }),
        hareket("konsinye", { consignmentIssueId: kns.id }),
        hareket("transfer", { stockTransferId: trf.id }),
        hareket("duzeltme", { stockAdjustmentId: dzl.id }),
      ],
    });

    const notlar = (await prisma.stockMovement.findMany({ where: sayilanBelgeler.stokHareketi, select: { note: true } })).map(
      (m) => m.note
    );
    expect(notlar).toEqual(["sevkiyat"]);
  });
});

describe("sayılan belgeler filtresi — değişmezlik", () => {
  it("filtre nesnesi dondurulmuştur; çağıran onu değiştiremez", () => {
    expect(Object.isFrozen(sayilanBelgeler)).toBe(true);
  });
});
