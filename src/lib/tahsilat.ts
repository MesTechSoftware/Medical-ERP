import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { uretBelgeNo } from "@/lib/belge-no";
import { tahsilatHareketiYaz } from "@/lib/cari-hareket";
import { IsHatasi } from "@/lib/hata";
import { hesaplaKomisyonTutari } from "@/lib/satir-tutarlari";
import { sert } from "@/lib/sonuc";

export type TahsilatGirdisi = {
  doktorId: string;
  odemeYontemiId: string;
  /** Brüt tahsil edilen tutar, doğrulanmış (`amountSchema`). */
  tutar: Decimal;
  odemeAni: Date;
  referansNo: string | null;
  not: string | null;
  yapanId: string;
};

/**
 * 🔴 Tahsilat kaydı — sistemin MERKEZÎ olayı (RULE-12); tahsilat akışının tek yazım yolu (ekran ve
 * demo geçmiş seed'i). Doktor bakiyesi hareketlerden HESAPLANIR (RULE-08); tahsilat siparişle
 * eşleştirilmez (X-6). Ödeme yöntemi tanım tablosudur; komisyon oranı kayda kopyalanır ve donar
 * (A-11). Numara, kayıt, cari hareket (X-11 §(5)) ve denetim kaydı çağıranın transaction'ındadır (X-2).
 */
export async function tahsilatYaz(tx: Prisma.TransactionClient, g: TahsilatGirdisi) {
  const yontem = await tx.paymentMethod.findUnique({ where: { id: g.odemeYontemiId } });
  if (!yontem || !yontem.isActive) throw new IsHatasi([sert("ODEME_YONTEMI_BULUNAMADI", {}, "paymentMethodId")]);
  const documentNo = await uretBelgeNo("THS", tx);
  const payment = await tx.doctorPayment.create({
    data: {
      documentNo,
      doctorId: g.doktorId,
      amount: g.tutar,
      paymentMethodId: g.odemeYontemiId,
      commissionRate: yontem.commissionRate,
      commissionAmount: hesaplaKomisyonTutari(g.tutar, yontem.commissionRate),
      paidAt: g.odemeAni,
      referenceNo: g.referansNo,
      note: g.not,
      recordedBy: g.yapanId,
    },
  });
  // A-11, X-11 §(5): tahsilat cari hareketi belgeyle aynı transaction'da.
  await tahsilatHareketiYaz(tx, {
    doctorId: g.doktorId,
    tutar: payment.amount,
    yon: payment.direction,
    documentNo,
    paymentId: payment.id,
    yapanId: g.yapanId,
  });
  await createAuditLog(
    {
      actorId: g.yapanId,
      action: AUDIT_ACTIONS.COLLECTION_CREATE,
      entityType: "DoctorPayment",
      entityId: payment.id,
      after: { documentNo, doctorId: g.doktorId, amount: g.tutar },
    },
    tx
  );
  return payment;
}
