import { prisma } from "@/lib/db";
import {
  DEFAULT_COMMISSION_RATE,
  calculateCommission,
  netPortionOfAllocation,
  periodOf,
  type Period,
  type CommissionResult,
} from "@/lib/commission";

/**
 * Prim dönemi veri erişimi. Saf hesap `commission.ts`'te; burada yalnızca
 * veriyi toplayıp o fonksiyonlara veriyoruz.
 */

/** Dönemin [başlangıç, bitiş) sınırları (yerel takvim ayı — FR-32). */
export function periodRange(p: Period): { start: Date; end: Date } {
  return {
    start: new Date(p.year, p.month - 1, 1, 0, 0, 0, 0),
    end: new Date(p.year, p.month, 1, 0, 0, 0, 0),
  };
}

export async function getSellerRate(sellerId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { commissionRate: true },
  });
  // FR-31: satıcı override'ı varsa o, yoksa sistem varsayılanı (FR-30).
  return user?.commissionRate ?? DEFAULT_COMMISSION_RATE;
}

/**
 * Dönem içinde TAHSİL EDİLEN tutarların NET karşılıkları (D-16, D-17).
 *
 * 🔴 Prim, siparişi açan satıcıya aittir (`Order.sellerId`) — doktorun GÜNCEL
 * sahibine değil. Devirde geçmiş primler eski satıcıda kalır (FR-07).
 */
export async function getNetAllocations(
  sellerId: string,
  p: Period
): Promise<bigint[]> {
  const { start, end } = periodRange(p);

  const allocations = await prisma.paymentAllocation.findMany({
    where: {
      payment: { status: "AKTIF", paidAt: { gte: start, lt: end } },
      order: { sellerId },
    },
    select: {
      amount: true,
      order: { select: { netTotal: true, grossTotal: true } },
    },
  });

  return allocations.map((a) =>
    netPortionOfAllocation(a.amount, a.order.netTotal, a.order.grossTotal)
  );
}

/** Henüz bir kapanışa işlenmemiş düzeltmeler (FR-35). */
export async function getPendingAdjustments(sellerId: string, p: Period) {
  return prisma.commissionAdjustment.findMany({
    where: {
      sellerId,
      year: p.year,
      month: p.month,
      appliedPeriodId: null,
    },
  });
}

export type PeriodPreview = CommissionResult & {
  period: Period;
  closed: boolean;
  /** Sipariş açıldı ama henüz tahsil edilmedi (FR-37 motivasyon göstergesi). */
  openReceivable: bigint;
};

/** Bir dönemin anlık (kapanmamışsa tahmini) prim durumu. */
export async function getPeriodPreview(
  sellerId: string,
  p: Period
): Promise<PeriodPreview> {
  const existing = await prisma.commissionPeriod.findUnique({
    where: { sellerId_year_month: { sellerId, year: p.year, month: p.month } },
  });

  if (existing) {
    // Kapanmış dönem DONDURULMUŞ değerleriyle gösterilir (RULE-05).
    return {
      period: p,
      closed: true,
      baseAmount: existing.baseAmount,
      adjustmentTotal: 0n,
      ratePercent: existing.ratePercent,
      commissionAmount: existing.commissionAmount,
      openReceivable: 0n,
    };
  }

  const [netAllocations, adjustments, rate, openOrders] = await Promise.all([
    getNetAllocations(sellerId, p),
    getPendingAdjustments(sellerId, p),
    getSellerRate(sellerId),
    prisma.order.findMany({
      where: { sellerId, status: { not: "CANCELLED" } },
      select: {
        grossTotal: true,
        allocations: {
          where: { payment: { status: "AKTIF" } },
          select: { amount: true },
        },
      },
    }),
  ]);

  const openReceivable = openOrders.reduce((s, o) => {
    const paid = o.allocations.reduce((t, a) => t + a.amount, 0n);
    const rest = o.grossTotal - paid;
    return rest > 0n ? s + rest : s;
  }, 0n);

  const result = calculateCommission({
    netAllocations,
    adjustments: adjustments.map((a) => a.amount),
    ratePercent: rate,
  });

  return { ...result, period: p, closed: false, openReceivable };
}

/**
 * FR-35 / RULE-05: kapanmış bir döneme ait tahsilat iptal edilirse, matrah
 * düzeltmesi AÇIK olan güncel döneme NEGATİF kayıt olarak yazılır.
 * Geçmiş dönem asla değiştirilmez.
 *
 * Not: `tx` alır çünkü iptal transaction'ının parçası olmalıdır.
 */
export async function queueCancellationAdjustments(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  payment: {
    id: string;
    paidAt: Date;
    allocations: { amount: bigint; orderId: string }[];
  },
  createdBy: string
): Promise<void> {
  if (payment.allocations.length === 0) return;

  const paymentPeriod = periodOf(payment.paidAt);
  const currentPeriod = periodOf(new Date());

  const orders = await tx.order.findMany({
    where: { id: { in: payment.allocations.map((a) => a.orderId) } },
    select: { id: true, sellerId: true, netTotal: true, grossTotal: true },
  });
  const orderById = new Map(orders.map((o) => [o.id, o]));

  // Satıcı bazında topla: aynı satıcıya tek düzeltme yazılır.
  const bySeller = new Map<string, bigint>();
  for (const alloc of payment.allocations) {
    const order = orderById.get(alloc.orderId);
    if (!order) continue;
    const net = netPortionOfAllocation(
      alloc.amount,
      order.netTotal,
      order.grossTotal
    );
    bySeller.set(order.sellerId, (bySeller.get(order.sellerId) ?? 0n) + net);
  }

  for (const [sellerId, netTotal] of bySeller) {
    const closed = await tx.commissionPeriod.findUnique({
      where: {
        sellerId_year_month: {
          sellerId,
          year: paymentPeriod.year,
          month: paymentPeriod.month,
        },
      },
      select: { id: true },
    });

    // Dönem kapanmamışsa düzeltmeye gerek yok: matrah zaten anlık hesaplanıyor
    // ve iptal edilen tahsilat sorgudan kendiliğinden düşer.
    if (!closed) continue;

    await tx.commissionAdjustment.create({
      data: {
        sellerId,
        year: currentPeriod.year,
        month: currentPeriod.month,
        amount: -netTotal,
        reason: `Kapanmış ${paymentPeriod.month}/${paymentPeriod.year} dönemine ait tahsilat iptali`,
        sourcePaymentId: payment.id,
        createdBy,
      },
    });
  }
}
