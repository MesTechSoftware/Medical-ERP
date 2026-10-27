import type { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { Aralik } from "@/lib/donem";

/** Teklif (A-5) hiçbir sayıma girmez; durum dağılımı iptali de gösterir, o yüzden `sayilanBelgeler.siparis` değil. */
const ONAYLI = { stage: "ONAYLI" } as const;

/**
 * Sipariş durum dağılımı (brief §3.3): aralıkta açılan onaylı siparişlerin bugünkü durumları.
 * Kaydı olmayan durum 0'dır.
 */
export async function siparisDagilimi(aralik: Aralik): Promise<Record<OrderStatus, number>> {
  const gruplar = await prisma.order.groupBy({
    by: ["status"],
    where: { ...ONAYLI, orderDate: { gte: aralik.baslangic, lt: aralik.bitis } },
    _count: { _all: true },
  });
  const sayi = (s: OrderStatus) => gruplar.find((g) => g.status === s)?._count._all ?? 0;
  return {
    BEKLIYOR: sayi("BEKLIYOR"),
    HAZIRLANIYOR: sayi("HAZIRLANIYOR"),
    KARGOLANDI: sayi("KARGOLANDI"),
    TESLIM_EDILDI: sayi("TESLIM_EDILDI"),
    IPTAL: sayi("IPTAL"),
  };
}

/**
 * Hazırlama süreleri, ms (K-D4: sipariş oluşturma → ilk sevk): ilk sevki aralıkta olan onaylı
 * siparişler. Sonraki kısmi sevkiyat süreyi değiştirmez; ilk sevki aralıktan önce olan sayılmaz.
 * Medyan ve yuvarlama `medyanGun()`'dedir (X-5 eki).
 */
export async function hazirlamaSureleri(aralik: Aralik): Promise<number[]> {
  const siparisler = await prisma.order.findMany({
    where: { ...ONAYLI, shipments: { some: { shippedAt: { gte: aralik.baslangic, lt: aralik.bitis } } } },
    select: {
      orderDate: true,
      shipments: { where: { shippedAt: { not: null } }, orderBy: { shippedAt: "asc" }, take: 1, select: { shippedAt: true } },
    },
  });
  return siparisler.flatMap((s) => {
    const ilk = s.shipments[0]?.shippedAt;
    return ilk && ilk >= aralik.baslangic && ilk < aralik.bitis ? [ilk.getTime() - s.orderDate.getTime()] : [];
  });
}
