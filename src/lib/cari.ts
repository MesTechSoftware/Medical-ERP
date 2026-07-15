import { prisma } from "@/lib/db";

// Satıcı cari hesabı hesaplama - TEK KAYNAK.
// Güncel Bakiye = Toplam Satış (iptal edilmemiş siparişler) − Toplam Ödeme
// Tüm tutarlar kuruş (integer).

export type Cari = {
  toplamSatis: number;
  toplamOdeme: number;
  guncelBakiye: number;
};

/** Tek bir satıcının cari durumunu hesaplar. */
export async function getSellerCari(sellerId: string): Promise<Cari> {
  const [sales, payments] = await Promise.all([
    prisma.order.aggregate({
      where: { sellerId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { sellerId },
      _sum: { amount: true },
    }),
  ]);

  const toplamSatis = sales._sum.totalAmount ?? 0;
  const toplamOdeme = payments._sum.amount ?? 0;
  return {
    toplamSatis,
    toplamOdeme,
    guncelBakiye: toplamSatis - toplamOdeme,
  };
}

/** Tüm satıcıların cari durumunu tek seferde (liste ekranları için). */
export async function getAllSellersCari(): Promise<Map<string, Cari>> {
  const [salesByseller, paymentsBySeller] = await Promise.all([
    prisma.order.groupBy({
      by: ["sellerId"],
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.payment.groupBy({
      by: ["sellerId"],
      _sum: { amount: true },
    }),
  ]);

  const salesMap = new Map(
    salesByseller.map((s) => [s.sellerId, s._sum.totalAmount ?? 0])
  );
  const payMap = new Map(
    paymentsBySeller.map((p) => [p.sellerId, p._sum.amount ?? 0])
  );

  const sellerIds = new Set([...salesMap.keys(), ...payMap.keys()]);
  const result = new Map<string, Cari>();
  for (const id of sellerIds) {
    const toplamSatis = salesMap.get(id) ?? 0;
    const toplamOdeme = payMap.get(id) ?? 0;
    result.set(id, {
      toplamSatis,
      toplamOdeme,
      guncelBakiye: toplamSatis - toplamOdeme,
    });
  }
  return result;
}
