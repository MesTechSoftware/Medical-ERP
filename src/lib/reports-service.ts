import { prisma } from "@/lib/db";
import { collectionRate, weightedDiscount } from "@/lib/reports";
import { availableBalance, type LedgerLot } from "@/lib/congress-ledger";
import { agingBucket } from "@/lib/allocation";
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
        prisma.paymentAllocation.aggregate({
          where: {
            payment: { status: "AKTIF" },
            order: { sellerId: s.id },
          },
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

/** Doktor ciro sıralaması + kongre bakiye + gecikmiş borç (FR-63). */
export type DoctorReport = {
  doctorId: string;
  fullName: string;
  sellerName: string | null;
  ciro: bigint;
  gecikmisBorc: bigint;
  kongreBakiye: bigint;
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
          dueDate: true,
          allocations: {
            where: { payment: { status: "AKTIF" } },
            select: { amount: true },
          },
        },
      },
      congressLedger: {
        where: { type: { in: ["EARN", "ADJUST"] }, remainingAmount: { gt: 0 } },
        select: { id: true, earnedAt: true, expiresAt: true, remainingAmount: true },
      },
    },
  });

  const now = new Date();
  const rows = doctors.map((d) => {
    const ciro = d.orders.reduce(
      (s, o) => s + (mode === "NET" ? o.netTotal : o.grossTotal),
      0n
    );
    const gecikmisBorc = d.orders.reduce((s, o) => {
      const paid = o.allocations.reduce((t, a) => t + a.amount, 0n);
      const rest = o.grossTotal - paid;
      return rest > 0n && agingBucket(o.dueDate, now) !== "NOT_DUE"
        ? s + rest
        : s;
    }, 0n);
    const kongreBakiye = availableBalance(d.congressLedger as LedgerLot[], now);

    return {
      doctorId: d.id,
      fullName: d.fullName,
      sellerName: d.ownerSeller?.name ?? null,
      ciro,
      gecikmisBorc,
      kongreBakiye,
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

/** Açık kongre bakiyesi toplamı — potansiyel yükümlülük (FR-60). */
export async function getCongressLiability(): Promise<bigint> {
  const lots = await prisma.congressLedger.findMany({
    where: {
      type: { in: ["EARN", "ADJUST"] },
      remainingAmount: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { remainingAmount: true },
  });
  return lots.reduce((s, l) => s + l.remainingAmount, 0n);
}
