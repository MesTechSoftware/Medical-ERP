import { prisma } from "@/lib/db";
import {
  availableBalance,
  earnFromCollection,
  expiredLots,
  expiringSoon,
  expiryFor,
  planFifoSpend,
  type LedgerLot,
} from "@/lib/congress-ledger";

/**
 * Kongre bakiyesi veri erişimi. Saf hesap `congress-ledger.ts`'te.
 *
 * 🔴 RULE-09: Aynı bakiye iki pakete aynı anda harcanamaz. Bunu, rezervasyonu
 * gerçek bir tüketim yaparak sağlıyoruz: TALEP anında lotlardan KOŞULLU
 * güncelleme ile düşüyoruz. Koşul veritabanında değerlendirildiği için iki
 * eşzamanlı talepten yalnızca biri geçebilir (stok yarışıyla aynı desen).
 */

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Doktorun kazanım lotları (EARN + pozitif ADJUST). */
export async function getLots(
  doctorId: string,
  tx: Tx | typeof prisma = prisma
): Promise<LedgerLot[]> {
  const rows = await tx.congressLedger.findMany({
    where: { doctorId, type: { in: ["EARN", "ADJUST"] }, remainingAmount: { gt: 0 } },
    orderBy: { earnedAt: "asc" },
    select: { id: true, earnedAt: true, expiresAt: true, remainingAmount: true },
  });
  return rows;
}

export async function getBalance(doctorId: string): Promise<bigint> {
  return availableBalance(await getLots(doctorId));
}

/** FR-59: yakında süresi dolacak bakiye (satıcı uyarısı). */
export async function getExpiringSoon(
  doctorId: string,
  days = 60
): Promise<bigint> {
  return expiringSoon(await getLots(doctorId), days);
}

/**
 * FR-49: Tahsilattan doğan kazanım. Tahsilatın NET karşılığı kadar (D-17),
 * %100 katsayıyla (D-11), son kullanma tarihi tahsilat + 12 ay (FR-50).
 *
 * Tahsilat transaction'ının PARÇASIDIR (RULE-12) — `tx` alır.
 */
export async function earnFromPayment(
  tx: Tx,
  input: {
    doctorId: string;
    paymentId: string;
    netAmount: bigint;
    paidAt: Date;
    createdBy: string;
  }
): Promise<bigint> {
  const amount = earnFromCollection(input.netAmount);
  if (amount <= 0n) return 0n;

  await tx.congressLedger.create({
    data: {
      doctorId: input.doctorId,
      type: "EARN",
      amount,
      earnedAt: input.paidAt,
      expiresAt: expiryFor(input.paidAt),
      remainingAmount: amount,
      refType: "DoctorPayment",
      refId: input.paymentId,
      createdBy: input.createdBy,
    },
  });
  return amount;
}

/**
 * FR-29 / OQ-08: Tahsilat iptalinde kazanımın geri alınması.
 *
 * Kazanım HARCANMIŞSA bakiye negatife düşebilir (D-23 kabul edildi): kalan
 * tüketilir, tüketilemeyen kısım için negatif ADJUST yazılır ve admin uyarılır.
 */
export async function reverseEarnForPayment(
  tx: Tx,
  paymentId: string,
  createdBy: string
): Promise<{ reversed: bigint; negative: bigint }> {
  const earns = await tx.congressLedger.findMany({
    where: { type: "EARN", refType: "DoctorPayment", refId: paymentId },
  });

  let reversed = 0n;
  let negative = 0n;

  for (const e of earns) {
    // Harcanmamış kısmı doğrudan geri al.
    const unused = e.remainingAmount;
    if (unused > 0n) {
      await tx.congressLedger.update({
        where: { id: e.id },
        data: { remainingAmount: 0n },
      });
      reversed += unused;
    }
    // Harcanmış kısım için negatif düzeltme (bakiye negatife düşebilir).
    const spent = e.amount - unused;
    if (spent > 0n) {
      negative += spent;
      await tx.congressLedger.create({
        data: {
          doctorId: e.doctorId,
          type: "ADJUST",
          amount: -spent,
          remainingAmount: 0n,
          expiresAt: null,
          refType: "DoctorPayment",
          refId: paymentId,
          note: "İptal edilen tahsilatın HARCANMIŞ kongre kazanımı (D-23)",
          createdBy,
        },
      });
    }
  }

  return { reversed, negative };
}

export type ReserveResult =
  | { ok: true; consumed: { lotId: string; amount: bigint }[] }
  | { ok: false; shortfall: bigint };

/**
 * FR-53/FR-54: Paket için bakiyeyi REZERVE eder (FIFO — RULE-11).
 *
 * Bakiye yetmezse HİÇBİR ŞEY tüketilmez ve eksik tutar döner (RULE-07, D-12:
 * sistem üzerinden fark ödemesi yapılamaz).
 */
export async function reserveBalance(
  tx: Tx,
  doctorId: string,
  amount: bigint,
  registrationId: string,
  createdBy: string
): Promise<ReserveResult> {
  const lots = await getLots(doctorId, tx);
  const plan = planFifoSpend(amount, lots);
  if (plan.shortfall > 0n) return { ok: false, shortfall: plan.shortfall };

  for (const c of plan.consumptions) {
    // 🔴 RULE-09: koşul veritabanında değerlendirilir. Eşzamanlı ikinci talep
    // aynı lotu tüketmişse count === 0 döner ve transaction geri alınır.
    const res = await tx.congressLedger.updateMany({
      where: { id: c.lotId, remainingAmount: { gte: c.amount } },
      data: { remainingAmount: { decrement: c.amount } },
    });
    if (res.count === 0) {
      throw new Error(
        "Bakiye rezerve edilemedi: aynı bakiye başka bir kayıt için kullanılıyor."
      );
    }

    // Harcama izi: hangi lottan ne kadar düşüldü (iadede aynı lota dönecek).
    await tx.congressLedger.create({
      data: {
        doctorId,
        type: "SPEND",
        amount: -c.amount,
        remainingAmount: 0n,
        expiresAt: null,
        registrationId,
        refType: "CongressLedger",
        refId: c.lotId,
        createdBy,
      },
    });
  }

  return { ok: true, consumed: plan.consumptions };
}

/**
 * FR-56: Kayıt iptalinde bakiye iade edilir — ORİJİNAL lotlara geri yazılır,
 * böylece son kullanma tarihi UZAMAZ (iptalle süre kazanılamaz).
 */
export async function refundReservation(
  tx: Tx,
  registrationId: string,
  createdBy: string
): Promise<bigint> {
  const spends = await tx.congressLedger.findMany({
    where: { registrationId, type: "SPEND" },
  });

  let refunded = 0n;
  for (const s of spends) {
    const back = -s.amount; // SPEND negatif kayıtlı
    if (!s.refId) continue;
    await tx.congressLedger.update({
      where: { id: s.refId },
      data: { remainingAmount: { increment: back } },
    });
    refunded += back;
  }

  if (refunded > 0n) {
    await tx.congressLedger.create({
      data: {
        doctorId: spends[0].doctorId,
        type: "ADJUST",
        amount: refunded,
        remainingAmount: 0n, // iade orijinal lota yazıldı; bu satır yalnız iz
        expiresAt: null,
        registrationId,
        refType: "CongressRegistration",
        refId: registrationId,
        note: "Kongre kaydı iptali — bakiye orijinal kazanımlara iade edildi (son kullanma uzatılmadı)",
        createdBy,
      },
    });
  }

  return refunded;
}

/**
 * FR-52: Süresi dolan kazanımlar için EXPIRE hareketi yazar.
 * Gecelik job + okuma anında tembel doğrulama için kullanılır.
 */
export async function expireLots(doctorId?: string): Promise<number> {
  const lots = await prisma.congressLedger.findMany({
    where: {
      type: { in: ["EARN", "ADJUST"] },
      remainingAmount: { gt: 0 },
      expiresAt: { not: null },
      ...(doctorId ? { doctorId } : {}),
    },
    select: {
      id: true,
      doctorId: true,
      earnedAt: true,
      expiresAt: true,
      remainingAmount: true,
    },
  });

  const stale = expiredLots(lots);
  if (stale.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const lot of stale) {
      // Koşullu: bu arada harcanmışsa yanlış tutar yazmayalım.
      const res = await tx.congressLedger.updateMany({
        where: { id: lot.id, remainingAmount: lot.remainingAmount },
        data: { remainingAmount: 0n },
      });
      if (res.count === 0) continue;

      const owner = lots.find((l) => l.id === lot.id)!;
      await tx.congressLedger.create({
        data: {
          doctorId: owner.doctorId,
          type: "EXPIRE",
          amount: -lot.remainingAmount,
          remainingAmount: 0n,
          expiresAt: null,
          refType: "CongressLedger",
          refId: lot.id,
          note: "12 aylık geçerlilik süresi doldu",
        },
      });
    }
  });

  return stale.length;
}
