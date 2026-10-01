import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";

// C6 (GÇ-8): RULE-03 taban fiyat reddi söküldü — iskonto tavanı yok, liste
// üstü satış serbest (A-10 · Ü-3 §(10)). Satıcının girdiği net fiyat, tabanın
// altında olsa bile siparişe olduğu gibi dondurulur.
const h = vi.hoisted(() => ({ sellerId: "" }));

vi.mock("@/lib/session", () => ({
  requireSeller: async () => ({ user: { id: h.sellerId, role: "SELLER" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));

const { createOrder } = await import("./actions");

async function seed() {
  const seller = await prisma.user.create({
    data: {
      name: "Satıcı",
      email: "satici@medikal.local",
      passwordHash: "test",
      role: "SELLER",
    },
  });
  h.sellerId = seller.id;

  const doctor = await prisma.doctor.create({
    data: {
      fullName: "Dr. Ayşe Kaya",
      clinic: "Klinik",
      region: "Bölge",
      phoneNormalized: "+905321112233",
      ownerSellerId: seller.id,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Stent",
      code: "MED-001",
      netListPrice: 1_000_00n, // 1.000,00 TL
      netMinPrice: 800_00n, //    800,00 TL taban
      vatRate: 20,
      stock: 10,
    },
  });

  return { doctor, product };
}

function siparisFormu(doctorId: string, productId: string, netUnitPriceTL?: number) {
  const fd = new FormData();
  fd.set("doctorId", doctorId);
  fd.set(
    "items",
    JSON.stringify([
      { productId, quantity: 2, ...(netUnitPriceTL !== undefined ? { netUnitPriceTL } : {}) },
    ])
  );
  return fd;
}

describe("sipariş — taban fiyat reddi yok (C6)", () => {
  let doctorId = "";
  let productId = "";

  beforeEach(async () => {
    const s = await seed();
    doctorId = s.doctor.id;
    productId = s.product.id;
  });

  it("tabanın altındaki birim fiyatla sipariş kabul edilir ve fiyat dondurulur", async () => {
    const sonuc = await createOrder({}, siparisFormu(doctorId, productId, 500));
    expect(sonuc?.error).toBeUndefined();

    const [item] = await prisma.orderItem.findMany();
    expect(item.netUnitPrice).toBe(500_00n);
    expect(item.listPriceAtSale).toBe(1_000_00n);
    expect(item.lineNetTotal).toBe(1_000_00n); // 2 × 500,00

    const order = await prisma.order.findFirstOrThrow();
    expect(order.netTotal).toBe(1_000_00n);
    expect(order.grossTotal).toBe(1_200_00n); // %20 KDV

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(8);
  });

  it("liste üstü fiyat da serbesttir", async () => {
    const sonuc = await createOrder({}, siparisFormu(doctorId, productId, 1_250));
    expect(sonuc?.error).toBeUndefined();

    const [item] = await prisma.orderItem.findMany();
    expect(item.netUnitPrice).toBe(1_250_00n);
  });

  it("vade = sipariş anı + policy.finance.odemeVadesiGunVarsayilan (30 gün, C7)", async () => {
    const once = Date.now();
    await createOrder({}, siparisFormu(doctorId, productId));

    const order = await prisma.order.findFirstOrThrow();
    const gun = (order.dueDate.getTime() - once) / 86_400_000;
    expect(gun).toBeGreaterThan(29.9);
    expect(gun).toBeLessThan(30.1);
  });

  it("fiyat girilmezse liste fiyatı kullanılır", async () => {
    await createOrder({}, siparisFormu(doctorId, productId));

    const [item] = await prisma.orderItem.findMany();
    expect(item.netUnitPrice).toBe(1_000_00n);
  });
});
