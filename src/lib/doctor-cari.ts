import { prisma } from "@/lib/db";

/**
 * Doktor cari hesabı — TEK KAYNAK.
 *
 * FR-20 / RULE-08: `Bakiye = Σ sipariş (iptal hariç, BRÜT) − Σ tahsilat`.
 * Bakiye ayrı bir kolonda TUTULMAZ; hareketlerden hesaplanır. Böylece
 * iptal ve düzeltmeler sonrası tutarsız bir kolon kalmaz.
 *
 * "Açık alacak" ya da yaşlandırma için ikinci bir fonksiyon YAZILMAZ — bütün
 * ekranlar bu bakiyeyi okur (K-2, X-6 §(9)). Mahsup C3'te söküldü (GÇ-3).
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
