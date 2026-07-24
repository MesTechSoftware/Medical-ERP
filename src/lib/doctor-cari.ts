import { prisma } from "@/lib/db";
import {
  agingBucket,
  summarizeAging,
  type AgingBucket,
  type OpenOrder,
} from "@/lib/allocation";

/**
 * Doktor cari hesabı — TEK KAYNAK.
 *
 * FR-20 / RULE-08: `Bakiye = Σ sipariş (iptal hariç, BRÜT) − Σ tahsilat`.
 * Bakiye ayrı bir kolonda TUTULMAZ; hareketlerden hesaplanır. Böylece
 * mahsuplaşma, iptal ve düzeltmeler sonrası tutarsız bir kolon kalmaz.
 *
 * Eski `src/lib/cari.ts` (satıcı-borçlu modeli) bunun yerini aldı — BRK-01.
 */

export type DoctorCari = {
  toplamSiparis: bigint; // brüt, iptal hariç
  toplamTahsilat: bigint; // aktif tahsilatlar
  bakiye: bigint; // pozitif = doktor borçlu
};

/** İptal edilmiş siparişler borç doğurmaz. */
const ACTIVE_ORDER = { status: { not: "CANCELLED" as const } };
const ACTIVE_PAYMENT = { status: "AKTIF" as const };

export async function getDoctorCari(doctorId: string): Promise<DoctorCari> {
  const [orders, payments] = await Promise.all([
    prisma.order.aggregate({
      where: { doctorId, ...ACTIVE_ORDER },
      _sum: { grossTotal: true },
    }),
    prisma.doctorPayment.aggregate({
      where: { doctorId, ...ACTIVE_PAYMENT },
      _sum: { amount: true },
    }),
  ]);

  const toplamSiparis = orders._sum.grossTotal ?? 0n;
  const toplamTahsilat = payments._sum.amount ?? 0n;
  return {
    toplamSiparis,
    toplamTahsilat,
    bakiye: toplamSiparis - toplamTahsilat,
  };
}

/** Liste ekranları için tüm doktorların carisi tek seferde. */
export async function getAllDoctorsCari(): Promise<Map<string, DoctorCari>> {
  const [orderGroups, paymentGroups] = await Promise.all([
    prisma.order.groupBy({
      by: ["doctorId"],
      where: ACTIVE_ORDER,
      _sum: { grossTotal: true },
    }),
    prisma.doctorPayment.groupBy({
      by: ["doctorId"],
      where: ACTIVE_PAYMENT,
      _sum: { amount: true },
    }),
  ]);

  const orderMap = new Map(
    orderGroups.map((g) => [g.doctorId, g._sum.grossTotal ?? 0n])
  );
  const payMap = new Map(
    paymentGroups.map((g) => [g.doctorId, g._sum.amount ?? 0n])
  );

  const result = new Map<string, DoctorCari>();
  for (const id of new Set([...orderMap.keys(), ...payMap.keys()])) {
    const toplamSiparis = orderMap.get(id) ?? 0n;
    const toplamTahsilat = payMap.get(id) ?? 0n;
    result.set(id, {
      toplamSiparis,
      toplamTahsilat,
      bakiye: toplamSiparis - toplamTahsilat,
    });
  }
  return result;
}

/**
 * Bir doktorun AÇIK siparişleri (kalan borcuyla), FIFO mahsup için.
 * Kalan borç = sipariş brütü − o siparişe yazılmış aktif mahsuplar.
 */
export async function getOpenOrders(doctorId: string): Promise<OpenOrder[]> {
  const orders = await prisma.order.findMany({
    where: { doctorId, ...ACTIVE_ORDER },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      dueDate: true,
      grossTotal: true,
      allocations: {
        where: { payment: { status: "AKTIF" } },
        select: { amount: true },
      },
    },
  });

  return orders
    .map((o) => ({
      id: o.id,
      dueDate: o.dueDate,
      outstanding:
        o.grossTotal - o.allocations.reduce((s, a) => s + a.amount, 0n),
    }))
    .filter((o) => o.outstanding > 0n);
}

export type SellerReceivable = {
  acikAlacak: bigint;
  gecikmis: bigint;
  doktorSayisi: number;
};

/**
 * Satıcı bazında TAHSİLAT SORUMLULUĞU (D-01, FR-27).
 * Satıcı borçlu değildir; bu tutarlar doktorların şirkete olan borcudur.
 */
export async function getSellerReceivables(): Promise<
  Map<string, SellerReceivable>
> {
  const [orders, doctorCounts] = await Promise.all([
    prisma.order.findMany({
      where: ACTIVE_ORDER,
      select: {
        sellerId: true,
        dueDate: true,
        grossTotal: true,
        allocations: {
          where: { payment: { status: "AKTIF" } },
          select: { amount: true },
        },
      },
    }),
    prisma.doctor.groupBy({
      by: ["ownerSellerId"],
      _count: { _all: true },
    }),
  ]);

  const result = new Map<string, SellerReceivable>();
  const ensure = (id: string) => {
    let r = result.get(id);
    if (!r) {
      r = { acikAlacak: 0n, gecikmis: 0n, doktorSayisi: 0 };
      result.set(id, r);
    }
    return r;
  };

  const now = new Date();
  for (const o of orders) {
    const outstanding =
      o.grossTotal - o.allocations.reduce((s, a) => s + a.amount, 0n);
    if (outstanding <= 0n) continue;
    const r = ensure(o.sellerId);
    r.acikAlacak += outstanding;
    if (agingBucket(o.dueDate, now) !== "NOT_DUE") r.gecikmis += outstanding;
  }

  for (const g of doctorCounts) {
    if (!g.ownerSellerId) continue;
    ensure(g.ownerSellerId).doktorSayisi = g._count._all;
  }

  return result;
}

/** Yaşlandırma özeti (FR-26). Satıcı kırılımı için `sellerId` verilebilir. */
export async function getAgingSummary(filter?: {
  sellerId?: string;
  doctorId?: string;
}): Promise<Record<AgingBucket, bigint>> {
  const orders = await prisma.order.findMany({
    where: {
      ...ACTIVE_ORDER,
      ...(filter?.sellerId ? { sellerId: filter.sellerId } : {}),
      ...(filter?.doctorId ? { doctorId: filter.doctorId } : {}),
    },
    select: {
      dueDate: true,
      grossTotal: true,
      allocations: {
        where: { payment: { status: "AKTIF" } },
        select: { amount: true },
      },
    },
  });

  return summarizeAging(
    orders.map((o) => ({
      dueDate: o.dueDate,
      outstanding:
        o.grossTotal - o.allocations.reduce((s, a) => s + a.amount, 0n),
    }))
  );
}
