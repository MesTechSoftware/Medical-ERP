import { prisma } from "@/lib/db";
import { collectionRate, weightedDiscount } from "@/lib/reports";
import type { VatMode } from "@/lib/vat-mode";

/** Satıcı performans karşılaştırması (FR-62). */
export type SellerReport = {
  sellerId: string;
  name: string;
  ciro: bigint; // seçili KDV moduna göre
  tahsilat: bigint;
  tahsilatOrani: number; // % (brüt üzerinden)
  ortalamaIskonto: number; // %
  doktorSayisi: number;
};

export async function getSellerReports(mode: VatMode): Promise<SellerReport[]> {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const reports = await Promise.all(
    sellers.map(async (s) => {
      const [orders, items, collected, doktorSayisi] = await Promise.all([
        prisma.order.findMany({
          where: { sellerId: s.id, status: { not: "CANCELLED" } },
          select: { netTotal: true, grossTotal: true },
        }),
        prisma.orderItem.findMany({
          where: { order: { sellerId: s.id, status: { not: "CANCELLED" } } },
          select: { listPriceAtSale: true, netUnitPrice: true, quantity: true },
        }),
        // Tahsilat siparişe eşlenmez (X-6); satıcıya doktorun sorumlusu
        // üzerinden sayılır. Dönem ve devir kuralı 1B'de (X-1 §(2), X-13).
        prisma.doctorPayment.aggregate({
          where: { status: "AKTIF", doctor: { ownerSellerId: s.id } },
          _sum: { amount: true },
        }),
        prisma.doctor.count({ where: { ownerSellerId: s.id } }),
      ]);

      const ciro = orders.reduce(
        (sum, o) => sum + (mode === "NET" ? o.netTotal : o.grossTotal),
        0n
      );
      const brut = orders.reduce((sum, o) => sum + o.grossTotal, 0n);
      const tahsilat = collected._sum.amount ?? 0n;

      return {
        sellerId: s.id,
        name: s.name,
        ciro,
        tahsilat,
        tahsilatOrani: collectionRate(tahsilat, brut),
        ortalamaIskonto: weightedDiscount(items),
        doktorSayisi,
      };
    })
  );

  return reports;
}

/** Doktor ciro sıralaması (FR-63). Gecikmiş borç tutarı C3'te söküldü (X-6 §(7)). */
export type DoctorReport = {
  doctorId: string;
  fullName: string;
  sellerName: string | null;
  ciro: bigint;
};

export async function getDoctorReports(
  mode: VatMode,
  limit = 50
): Promise<DoctorReport[]> {
  const doctors = await prisma.doctor.findMany({
    include: {
      ownerSeller: { select: { name: true } },
      orders: {
        where: { status: { not: "CANCELLED" } },
        select: {
          netTotal: true,
          grossTotal: true,
        },
      },
    },
  });

  const rows = doctors.map((d) => {
    const ciro = d.orders.reduce(
      (s, o) => s + (mode === "NET" ? o.netTotal : o.grossTotal),
      0n
    );

    return {
      doctorId: d.id,
      fullName: d.fullName,
      sellerName: d.ownerSeller?.name ?? null,
      ciro,
    };
  });

  // Ciroya göre azalan sırala (BigInt karşılaştırması).
  rows.sort((a, b) => (b.ciro === a.ciro ? 0 : b.ciro > a.ciro ? 1 : -1));
  return rows.slice(0, limit);
}

/** Kanal karşılaştırması: Satıcı kanalı vs Bayi kanalı ciro (FR-60). */
export type ChannelReport = {
  saticiCiro: bigint;
  saticiTahsilat: bigint;
  bayiCiro: bigint;
  bayiTahsilat: bigint;
};

export async function getChannelReport(mode: VatMode): Promise<ChannelReport> {
  const field = mode === "NET" ? "netTotal" : "grossTotal";
  const [orders, doctorPay, shipments, dealerPay] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { [field]: true } as { netTotal?: true; grossTotal?: true },
    }),
    prisma.doctorPayment.aggregate({
      where: { status: "AKTIF" },
      _sum: { amount: true },
    }),
    prisma.dealerShipment.aggregate({
      where: { status: "ONAYLANDI" },
      _sum: { [field]: true } as { netTotal?: true; grossTotal?: true },
    }),
    prisma.dealerPayment.aggregate({ _sum: { amount: true } }),
  ]);

  const orderSum = (orders._sum as Record<string, bigint | null>)[field] ?? 0n;
  const shipSum = (shipments._sum as Record<string, bigint | null>)[field] ?? 0n;

  return {
    saticiCiro: orderSum,
    saticiTahsilat: doctorPay._sum.amount ?? 0n,
    bayiCiro: shipSum,
    bayiTahsilat: dealerPay._sum.amount ?? 0n,
  };
}
