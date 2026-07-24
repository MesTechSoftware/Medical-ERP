import { prisma } from "@/lib/db";
import {
  summarizeAging,
  type AgingBucket,
} from "@/lib/allocation";

/**
 * Bayi cari hesabı — TEK KAYNAK.
 *
 * FR-45 / RULE-08: `Bakiye = Σ Sevkiyat (ONAYLANDI) − Σ Ödeme`.
 * TALEP/İPTAL/REDDEDİLDİ sevkiyatlar cariye GİRMEZ — yalnızca onaylı sevkiyat
 * borç doğurur (talep aşamasında stok/cari etkilenmez).
 */

export type DealerCari = {
  toplamSevkiyat: bigint; // brüt, onaylı
  toplamOdeme: bigint;
  bakiye: bigint; // pozitif = bayi borçlu
};

const APPROVED = { status: "ONAYLANDI" as const };

export async function getDealerCari(dealerId: string): Promise<DealerCari> {
  const [shipments, payments] = await Promise.all([
    prisma.dealerShipment.aggregate({
      where: { dealerId, ...APPROVED },
      _sum: { grossTotal: true },
    }),
    prisma.dealerPayment.aggregate({
      where: { dealerId },
      _sum: { amount: true },
    }),
  ]);

  const toplamSevkiyat = shipments._sum.grossTotal ?? 0n;
  const toplamOdeme = payments._sum.amount ?? 0n;
  return {
    toplamSevkiyat,
    toplamOdeme,
    bakiye: toplamSevkiyat - toplamOdeme,
  };
}

/** Liste ekranları için tüm bayilerin carisi tek seferde. */
export async function getAllDealersCari(): Promise<Map<string, DealerCari>> {
  const [shipmentGroups, paymentGroups] = await Promise.all([
    prisma.dealerShipment.groupBy({
      by: ["dealerId"],
      where: APPROVED,
      _sum: { grossTotal: true },
    }),
    prisma.dealerPayment.groupBy({
      by: ["dealerId"],
      _sum: { amount: true },
    }),
  ]);

  const shipMap = new Map(
    shipmentGroups.map((g) => [g.dealerId, g._sum.grossTotal ?? 0n])
  );
  const payMap = new Map(
    paymentGroups.map((g) => [g.dealerId, g._sum.amount ?? 0n])
  );

  const result = new Map<string, DealerCari>();
  for (const id of new Set([...shipMap.keys(), ...payMap.keys()])) {
    const toplamSevkiyat = shipMap.get(id) ?? 0n;
    const toplamOdeme = payMap.get(id) ?? 0n;
    result.set(id, {
      toplamSevkiyat,
      toplamOdeme,
      bakiye: toplamSevkiyat - toplamOdeme,
    });
  }
  return result;
}

/**
 * Bayi yaşlandırması (FR-46). Basit model: onaylı sevkiyatların vadesine göre
 * kalan borç. Bayi tahsilatı sipariş bazında mahsuplaşmaz (doktordan farklı);
 * bu yüzden en eski sevkiyatlardan itibaren toplam ödeme düşülür.
 */
export async function getDealerAging(
  dealerId: string
): Promise<Record<AgingBucket, bigint>> {
  const [shipments, paid] = await Promise.all([
    prisma.dealerShipment.findMany({
      where: { dealerId, ...APPROVED, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true, grossTotal: true },
    }),
    prisma.dealerPayment.aggregate({
      where: { dealerId },
      _sum: { amount: true },
    }),
  ]);

  // Ödemeyi en eski sevkiyattan başlayarak düş (FIFO benzeri kapatma).
  let remainingPayment = paid._sum.amount ?? 0n;
  const open = shipments.map((s) => {
    const applied = remainingPayment < s.grossTotal ? remainingPayment : s.grossTotal;
    remainingPayment -= applied;
    return { dueDate: s.dueDate!, outstanding: s.grossTotal - applied };
  });

  return summarizeAging(open);
}
