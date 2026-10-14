import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { getCiroTotal, getDoctorReports, getSellerReports } from "@/lib/reports-service";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Satıcı raporundaki tahsilat satıcının sorumlu olduğu doktorların AKTİF tahsilatlarıdır
// (X-6 — tahsilat siparişe eşlenmez). Ciro MATRAHTIR ve SEVK EDİLEN maldan doğar (A-3, Ü-3).

async function satici(name: string, email: string) {
  return prisma.user.create({ data: { name, email, passwordHash: "test", role: "SATICI" } });
}

async function doktor(ad: string, sahipId: string | null) {
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(ad) });
  if (sahipId) {
    await prisma.$transaction((tx) =>
      degistirDoktorSahibi([d.id], sahipId, { metin: "test", yapanId: sahipId }, tx)
    );
  }
  return d;
}

let no = 0;
async function tahsilat(doctorId: string, amount: string, recordedBy: string, paymentMethodId: string, status: "AKTIF" | "IPTAL" = "AKTIF") {
  no += 1;
  return prisma.doctorPayment.create({
    data: {
      documentNo: `THS-T-${no}`,
      doctorId,
      amount,
      paymentMethodId,
      commissionRate: "0",
      commissionAmount: "0",
      recordedBy,
      status,
    },
  });
}

describe("satıcı raporu — tahsilat", () => {
  it("satıcının doktorlarının aktif tahsilatlarını toplar; iptal ve başkasınınki sayılmaz", async () => {
    const { havale } = await referansVeri();
    const ali = await satici("Ali", "ali@medikal.local");
    const veli = await satici("Veli", "veli@medikal.local");

    const d1 = await doktor("Dr. A", ali.id);
    const d2 = await doktor("Dr. B", ali.id);
    const d3 = await doktor("Dr. C", veli.id);
    const sahipsiz = await doktor("Dr. D", null);

    await tahsilat(d1.id, "1000.00", ali.id, havale.id);
    await tahsilat(d2.id, "2500.50", ali.id, havale.id);
    await tahsilat(d2.id, "9999.99", ali.id, havale.id, "IPTAL");
    await tahsilat(d3.id, "700.00", veli.id, havale.id);
    await tahsilat(sahipsiz.id, "50.00", ali.id, havale.id);

    const byName = new Map((await getSellerReports()).map((r) => [r.name, r]));
    expect(byName.get("Ali")?.tahsilat.toFixed(2)).toBe("3500.50");
    expect(byName.get("Veli")?.tahsilat.toFixed(2)).toBe("700.00");
  });
});

describe("ciro — matrah, sevk edilen mal (A-3 · Ü-3 C sınıfı)", () => {
  it("yalnız sevkiyat satırları sayılır; sevk edilmemiş sipariş ve bedelsiz satır ciroya girmez", async () => {
    const { kdv20 } = await referansVeri();
    const ali = await satici("Ali", "ali@medikal.local");
    const d1 = await doktor("Dr. A", ali.id);
    const urun = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: kdv20.id } });

    const order = await prisma.order.create({
      data: {
        documentNo: "SIP-T-1",
        sellerId: ali.id,
        doctorId: d1.id,
        paymentTermDays: 30,
        stage: "ONAYLI",
        items: {
          create: [
            { productId: urun.id, quantity: 10, listPrice: "100", unitPrice: "90", vatRate: "20" },
            { productId: urun.id, quantity: 3, listPrice: "100", unitPrice: "100", vatRate: "20", isFree: true },
          ],
        },
      },
      include: { items: true },
    });
    // Sevk edilmemiş ikinci sipariş: ciroya girmez.
    await prisma.order.create({
      data: {
        documentNo: "SIP-T-2",
        sellerId: ali.id,
        doctorId: d1.id,
        paymentTermDays: 30,
        items: { create: [{ productId: urun.id, quantity: 99, listPrice: "100", unitPrice: "100", vatRate: "20" }] },
      },
    });

    const satilan = order.items.find((i) => !i.isFree)!;
    const bedelsiz = order.items.find((i) => i.isFree)!;
    await prisma.shipment.create({
      data: {
        documentNo: "SVK-T-1",
        orderId: order.id,
        items: {
          create: [
            { orderItemId: satilan.id, quantity: 4 }, // kısmi sevkiyat: 4 × 90 = 360
            { orderItemId: bedelsiz.id, quantity: 3 },
          ],
        },
      },
    });

    expect((await getCiroTotal()).toFixed(2)).toBe("360.00");
    const [r] = await getSellerReports();
    expect(r.ciro.toFixed(2)).toBe("360.00");
    expect(r.ortalamaIskonto?.toFixed(2)).toBe("10.00");
  });

  it("TEKLIF ve iptal siparişin sevk satırı ciroya girmez — sayılan belgeler filtresi (A-5-6)", async () => {
    const { kdv20 } = await referansVeri();
    const ali = await satici("Ali", "ali@medikal.local");
    const d1 = await doktor("Dr. A", ali.id);
    const urun = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: kdv20.id } });

    const sevkliSiparis = async (documentNo: string, stage: "TEKLIF" | "ONAYLI", status: "BEKLIYOR" | "IPTAL", unitPrice: string) => {
      const o = await prisma.order.create({
        data: {
          documentNo,
          sellerId: ali.id,
          doctorId: d1.id,
          paymentTermDays: 30,
          stage,
          status,
          items: { create: [{ productId: urun.id, quantity: 1, listPrice: unitPrice, unitPrice, vatRate: "20" }] },
        },
        include: { items: true },
      });
      await prisma.shipment.create({
        data: { documentNo: `SVK-${documentNo}`, orderId: o.id, items: { create: [{ orderItemId: o.items[0].id, quantity: 1 }] } },
      });
    };
    await sevkliSiparis("SIP-A", "ONAYLI", "BEKLIYOR", "100");
    await sevkliSiparis("SIP-B", "TEKLIF", "BEKLIYOR", "7000");
    await sevkliSiparis("SIP-C", "ONAYLI", "IPTAL", "9000");

    expect((await getCiroTotal()).toFixed(2)).toBe("100.00");
    const [r] = await getSellerReports();
    expect(r.ciro.toFixed(2)).toBe("100.00");
    const [dr] = await getDoctorReports();
    expect(dr.ciro.toFixed(2)).toBe("100.00");
  });

  it("sevkiyat yoksa ciro sıfırdır (R-11: CM → 1B arası sevkiyat satırı yazılmaz)", async () => {
    await referansVeri();
    await satici("Ali", "ali@medikal.local");
    expect((await getCiroTotal()).toFixed(2)).toBe("0.00");
    const [r] = await getSellerReports();
    expect(r.ortalamaIskonto).toBeNull();
  });
});
