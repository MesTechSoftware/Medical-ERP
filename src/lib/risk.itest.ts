import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorRisk } from "@/lib/doctor-cari";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// `hesaplaDoktorRisk(doktor)` — KABUL_KRITERLERI A-12-1…A-12-4.

let doktorId = "";
let yapanId = "";
let urunId = "";
let no = 0;

type Satir = { miktar: number; birim: string; kdv?: string; bedelsiz?: boolean };

const hareket = (type: "SEVKIYAT" | "TAHSILAT", direction: "BORC" | "ALACAK", amount: string) =>
  prisma.ledgerEntry.create({ data: { doctorId: doktorId, type, direction, amount, documentNo: "T", createdById: yapanId } });

function siparis(satirlar: Satir[], stage: "TEKLIF" | "ONAYLI" = "ONAYLI", status: "BEKLIYOR" | "IPTAL" = "BEKLIYOR", doktor = doktorId) {
  no += 1;
  return prisma.order.create({
    data: {
      documentNo: `SIP-R-${no}`,
      doctorId: doktor,
      paymentTermDays: 30,
      stage,
      status,
      items: {
        create: satirlar.map((s) => ({
          productId: urunId,
          quantity: s.miktar,
          listPrice: s.birim,
          unitPrice: s.birim,
          vatRate: s.kdv ?? "20",
          isFree: s.bedelsiz ?? false,
          freeReason: s.bedelsiz ? "NUMUNE" : null,
        })),
      },
    },
    include: { items: true },
  });
}

function sevkEt(orderId: string, satirlar: { orderItemId: string; quantity: number }[]) {
  no += 1;
  return prisma.shipment.create({ data: { documentNo: `SVK-R-${no}`, orderId, items: { create: satirlar } } });
}

beforeEach(async () => {
  const ref = await referansVeri();
  const u = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  const p = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: ref.kdv20.id } });
  yapanId = u.id;
  doktorId = d.id;
  urunId = p.id;
});

describe("hesaplaDoktorRisk — bakiye + açık sipariş (A-12-1)", () => {
  it("cari bakiyeye ONAYLI siparişin tutarı eklenir; TEKLIF, IPTAL ve başka doktor girmez", async () => {
    await hareket("SEVKIYAT", "BORC", "500");
    await siparis([{ miktar: 2, birim: "100" }]); // 240,00 brüt
    await siparis([{ miktar: 9, birim: "100" }], "TEKLIF");
    await siparis([{ miktar: 9, birim: "100" }], "ONAYLI", "IPTAL");
    const baska = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Başka") });
    await siparis([{ miktar: 9, birim: "100" }], "ONAYLI", "BEKLIYOR", baska.id);

    const r = await hesaplaDoktorRisk(doktorId);
    expect(r.bakiye.toFixed(2)).toBe("500.00");
    expect(r.acikSiparis.toFixed(2)).toBe("240.00");
    expect(r.risk.toFixed(2)).toBe("740.00");
  });

  it("avans riski düşürür", async () => {
    await hareket("SEVKIYAT", "BORC", "1000");
    await hareket("TAHSILAT", "ALACAK", "1250");
    await siparis([{ miktar: 2, birim: "100" }]);
    expect((await hesaplaDoktorRisk(doktorId)).risk.toFixed(2)).toBe("-10.00");
  });

  it("hareket ve sipariş yoksa risk sıfırdır", async () => {
    const r = await hesaplaDoktorRisk(doktorId);
    expect(r.risk.toFixed(2)).toBe("0.00");
    expect(r.acikSiparis.toFixed(2)).toBe("0.00");
  });
});

describe("hesaplaDoktorRisk — sevk edilmemiş miktar (A-12-2)", () => {
  it("kısmi sevkte kalan miktar girer; tamamen sevk edilen satır girmez", async () => {
    const o = await siparis([
      { miktar: 5, birim: "100" },
      { miktar: 4, birim: "50" },
    ]);
    const [kismi, tam] = o.items;
    await sevkEt(o.id, [{ orderItemId: kismi.id, quantity: 1 }, { orderItemId: tam.id, quantity: 4 }]);
    await sevkEt(o.id, [{ orderItemId: kismi.id, quantity: 1 }]);

    // Kalan: 3 × 100 × 1,20 = 360,00; ikinci satır kapandı.
    expect((await hesaplaDoktorRisk(doktorId)).acikSiparis.toFixed(2)).toBe("360.00");
  });
});

describe("hesaplaDoktorRisk — brüt taban (A-12-3)", () => {
  it("bedelsiz satır girmez; satır KDV dahil ve satır bazında yuvarlanır", async () => {
    await siparis([
      { miktar: 1, birim: "33.335" }, // matrah 33,34 · KDV 6,67 · toplam 40,01
      { miktar: 3, birim: "100", bedelsiz: true },
    ]);
    expect((await hesaplaDoktorRisk(doktorId)).acikSiparis.toFixed(2)).toBe("40.01");
  });
});

describe("hesaplaDoktorRisk — kredi limiti (A-12-4)", () => {
  const limit = (creditLimit: string | null) => prisma.doctor.update({ where: { id: doktorId }, data: { creditLimit } });

  it("limit boşsa limitsizdir, aşım yoktur", async () => {
    await hareket("SEVKIYAT", "BORC", "1000000");
    const r = await hesaplaDoktorRisk(doktorId);
    expect(r.krediLimiti).toBeNull();
    expect(r.limitAsildi).toBe(false);
  });

  it("risk limite eşitse aşım yoktur; limitten büyükse vardır", async () => {
    await hareket("SEVKIYAT", "BORC", "500");
    await siparis([{ miktar: 2, birim: "100" }]); // risk 740,00

    await limit("740.00");
    const esit = await hesaplaDoktorRisk(doktorId);
    expect(esit.krediLimiti?.toFixed(2)).toBe("740.00");
    expect(esit.limitAsildi).toBe(false);

    await limit("739.99");
    expect((await hesaplaDoktorRisk(doktorId)).limitAsildi).toBe(true);
  });

  it("transaction istemcisiyle de okur", async () => {
    await hareket("SEVKIYAT", "BORC", "75");
    const r = await prisma.$transaction((tx) => hesaplaDoktorRisk(doktorId, tx));
    expect(r.risk.toFixed(2)).toBe("75.00");
  });
});
