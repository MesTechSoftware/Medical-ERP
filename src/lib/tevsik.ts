import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import type { LedgerDirection } from "@/generated/prisma/enums";
import { policy } from "@/lib/policy";
import { bilgi, type Bildirim } from "@/lib/sonuc";
import { gunAraligi } from "@/lib/zaman";

/**
 * Nakit tahsilatta tevsik limiti uyarısı — A-15. `BILGI` kademesidir: kayıt engellenmez,
 * `OnayBlogu` üretilmez, hesaplanan toplam saklanmaz (A-15 §(1)/(2)/(6)).
 *
 * Toplam: aynı cari + aynı `Europe/Istanbul` günü + `tip = NAKIT` + aynı yön, iptal edilmemiş
 * tahsilatlar; **aşan işlem dâhil** (A-15 §(1)/(4), E-1 §(3)). Limit `finance.nakitTevsikLimiti`
 * çalışma anında okunur; `null` = kapalı (§(3)). Kısım kısım kuralı hesaplanmaz (kalıcı).
 *
 * Yeni tahsilat aynı transaction'da yazıldıktan sonra çağrılır; toplama SQL'dedir.
 */
export async function nakitTevsikUyarisi(
  tx: Prisma.TransactionClient,
  girdi: { doctorId: string; an: Date; yon: LedgerDirection },
  limit: string | null = policy.finance.nakitTevsikLimiti
): Promise<Bildirim | null> {
  if (limit === null) return null;
  const { baslangic, bitis } = gunAraligi(girdi.an);
  const { _sum } = await tx.doctorPayment.aggregate({
    where: {
      doctorId: girdi.doctorId,
      direction: girdi.yon,
      status: { not: "IPTAL" },
      paidAt: { gte: baslangic, lt: bitis },
      paymentMethod: { type: "NAKIT" },
    },
    _sum: { amount: true },
  });
  const toplam = _sum.amount ?? new Decimal(0);
  if (!toplam.gt(limit)) return null;
  return bilgi("NAKIT_TEVSIK_LIMITI", { toplam: toplam.toFixed(2), limit: new Decimal(limit).toFixed(2) });
}
