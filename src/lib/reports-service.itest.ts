import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { getCiroTotal, getSellerReports } from "@/lib/reports-service";

// Satıcı raporundaki tahsilat C3'te mahsup satırından (PaymentAllocation)
// koparıldı: artık satıcının sorumlu olduğu doktorların AKTİF tahsilatları
// toplanır (X-6 — tahsilat siparişe eşlenmez). Tahsilat oranı C4'te söküldü (GÇ-2).

async function satici(name: string, email: string) {
  return prisma.user.create({
    data: { name, email, passwordHash: "test", role: "SELLER" },
  });
}

async function doktor(fullName: string, phone: string, ownerSellerId: string | null) {
  return prisma.doctor.create({
    data: {
      fullName,
      clinic: "Klinik",
      region: "Bölge",
      phoneNormalized: phone,
      ownerSellerId,
    },
  });
}

async function tahsilat(doctorId: string, amount: bigint, recordedBy: string, status: "AKTIF" | "IPTAL" = "AKTIF") {
  return prisma.doctorPayment.create({
    data: { doctorId, amount, method: "TRANSFER", recordedBy, status },
  });
}

describe("satıcı raporu — tahsilat (C3)", () => {
  it("satıcının doktorlarının aktif tahsilatlarını toplar; iptal ve başkasınınki sayılmaz", async () => {
    const ali = await satici("Ali", "ali@medikal.local");
    const veli = await satici("Veli", "veli@medikal.local");

    const d1 = await doktor("Dr. A", "+905320000001", ali.id);
    const d2 = await doktor("Dr. B", "+905320000002", ali.id);
    const d3 = await doktor("Dr. C", "+905320000003", veli.id);
    const sahipsiz = await doktor("Dr. D", "+905320000004", null);

    await tahsilat(d1.id, 100_000n, ali.id);
    await tahsilat(d2.id, 250_050n, ali.id);
    await tahsilat(d2.id, 999_999n, ali.id, "IPTAL");
    await tahsilat(d3.id, 70_000n, veli.id);
    await tahsilat(sahipsiz.id, 5_000n, ali.id);

    const rapor = await getSellerReports("GROSS");
    const byName = new Map(rapor.map((r) => [r.name, r]));

    expect(byName.get("Ali")?.tahsilat).toBe(350_050n);
    expect(byName.get("Veli")?.tahsilat).toBe(70_000n);
  });

  it("siparişi olmayan satıcının tahsilatı da sayılır — eşleştirme aranmaz", async () => {
    const ali = await satici("Ali", "ali@medikal.local");
    const d1 = await doktor("Dr. A", "+905320000001", ali.id);
    await tahsilat(d1.id, 42_00n, ali.id);

    const [r] = await getSellerReports("GROSS");

    expect(r.ciro).toBe(0n);
    expect(r.tahsilat).toBe(42_00n);
    expect(await prisma.paymentAllocation.count()).toBe(0);
  });
});

describe("toplam ciro (C5 — kanal karşılaştırmasının yerine)", () => {
  it("KDV moduna göre net/brüt toplar; iptal edilen sipariş sayılmaz", async () => {
    const ali = await satici("Ali", "ali@medikal.local");
    const d1 = await doktor("Dr. A", "+905320000001", ali.id);
    const siparis = (netTotal: bigint, grossTotal: bigint, status?: "CANCELLED") =>
      prisma.order.create({
        data: {
          sellerId: ali.id,
          doctorId: d1.id,
          netTotal,
          vatTotal: grossTotal - netTotal,
          grossTotal,
          dueDate: new Date("2026-10-15T00:00:00.000Z"),
          ...(status ? { status } : {}),
        },
      });

    await siparis(1_000_00n, 1_100_00n);
    await siparis(500_00n, 600_00n);
    await siparis(9_999_00n, 9_999_00n, "CANCELLED");

    expect(await getCiroTotal("NET")).toBe(1_500_00n);
    expect(await getCiroTotal("GROSS")).toBe(1_700_00n);
  });
});
