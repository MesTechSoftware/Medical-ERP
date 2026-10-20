"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaff } from "@/lib/session";
import { amountSchema } from "@/lib/validation";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { uretBelgeNo } from "@/lib/belge-no";
import { hesaplaKomisyonTutari } from "@/lib/satir-tutarlari";
import { simdi } from "@/lib/zaman";
import { IsHatasi } from "@/lib/hata";
import { basarili, engel, sert, sonucOlustur, type Bildirim, type IslemSonucu } from "@/lib/sonuc";
import { nakitTevsikUyarisi } from "@/lib/tevsik";
import { vadesiGecmisUyarisi } from "@/lib/doctor-cari";
import { tahsilatHareketiYaz, tersKayitYaz } from "@/lib/cari-hareket";

/**
 * 🔴 Tahsilat kaydı — sistemin MERKEZÎ olayı (RULE-12).
 *
 * Tahsilat kaydı yazılır; doktor bakiyesi hareketlerden HESAPLANIR (ayrı
 * kolon yok — RULE-08). Tahsilat hiçbir siparişle eşleştirilmez: FIFO mahsup
 * C3'te söküldü (GÇ-3, X-6), kongre kazanımı C2'de (GÇ-4).
 *
 * Ödeme yöntemi tanım tablosudur; komisyon oranı kayda kopyalanır ve donar (A-11).
 * Cari hareket (`TAHSILAT`) aynı transaction'da yazılır (X-11 §(5)) — tahsilat belge akışıyla
 * 1B madde 7'de (A-11, FAZ1 R-11); o zamana kadar yazılmaz. Numara ve kayıt aynı
 * transaction'dadır (X-2, 1B madde 2).
 */
export async function recordCollection(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireStaff();

  const doctorId = (formData.get("doctorId") as string)?.trim();
  const paymentMethodId = (formData.get("paymentMethodId") as string)?.trim();
  const tutar = amountSchema.safeParse(formData.get("amount") ?? "");
  if (!doctorId) return engel("ALAN_ZORUNLU", {}, "doctorId");
  if (!tutar.success) return engel("GECERSIZ_TUTAR", {}, "amount");
  if (!paymentMethodId) return engel("ALAN_ZORUNLU", {}, "paymentMethodId");
  const amount = tutar.data;

  let uyarilar: Bildirim[];
  try {
    uyarilar = await prisma.$transaction(async (tx) => {
      const yontem = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } });
      if (!yontem || !yontem.isActive) throw new IsHatasi([sert("ODEME_YONTEMI_BULUNAMADI", {}, "paymentMethodId")]);
      const documentNo = await uretBelgeNo("THS", tx);
      const payment = await tx.doctorPayment.create({
        data: {
          documentNo,
          doctorId,
          amount,
          paymentMethodId,
          commissionRate: yontem.commissionRate,
          commissionAmount: hesaplaKomisyonTutari(amount, yontem.commissionRate),
          paidAt: formData.get("paidAt")
            ? new Date(String(formData.get("paidAt")))
            : simdi(),
          referenceNo:
            ((formData.get("referenceNo") as string) || "").trim() || null,
          note: ((formData.get("note") as string) || "").trim() || null,
          recordedBy: session.user.id,
        },
      });
      // A-11, X-11 §(5): tahsilat cari hareketi belgeyle aynı transaction'da.
      await tahsilatHareketiYaz(tx, {
        doctorId,
        tutar: payment.amount,
        yon: payment.direction,
        documentNo,
        paymentId: payment.id,
        yapanId: session.user.id,
      });
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.COLLECTION_CREATE,
          entityType: "DoctorPayment",
          entityId: payment.id,
          after: { documentNo, doctorId, amount },
        },
        tx
      );
      // A-15: nakit tevsik uyarısı BILGI'dir — kayıt tamamlanır, uyarı sonuçla döner.
      const tevsik = await nakitTevsikUyarisi(tx, { doctorId, an: payment.paidAt, yon: payment.direction });
      // X-6 §(6): tahsilat ekranında vadesi geçmiş hareketin varlığı (BILGI). Bütün uyarılar döner (X-4 §(7)).
      const vade = await vadesiGecmisUyarisi(doctorId, undefined, tx);
      return [tevsik, vade].filter((b): b is Bildirim => b !== null);
    });
  } catch (e) {
    // Yalnız iş hatası sonuca döner; teknik hata hata sınırına düşer (X-3 §(4), X-4 §(2)).
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }

  revalidatePath("/collections");
  revalidatePath("/doctors");

  return sonucOlustur(uyarilar);
}

/**
 * FR-29: Tahsilat iptali. Tahsilat `IPTAL` işaretlenir ve cari hareketi `TERS_KAYIT` ile çevrilir
 * (X-11 §(5), §0.2): hareket silinmez, bakiye ters hareketle geri döner. İşaret koşullu yazılır —
 * eşzamanlı iki iptalden yalnız biri ters kayıt yazar. 1B-7b öncesi kaydedilmiş, cari hareketi
 * olmayan tahsilatta çevrilecek satır yoktur.
 */
export async function cancelCollection(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireStaff();
  const paymentId = (formData.get("paymentId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim() || null;
  if (!paymentId) return engel("TAHSILAT_BULUNAMADI");

  const before = await prisma.doctorPayment.findUnique({
    where: { id: paymentId },
  });
  if (!before) return engel("TAHSILAT_BULUNAMADI");
  if (before.status === "IPTAL") return engel("TAHSILAT_ZATEN_IPTAL");

  // Prim düzeltmesi (FR-35) C4'te söküldü — dönem kilidi yok (X-1 §(6)).
  const iptalEdildi = await prisma.$transaction(async (tx) => {
    const res = await tx.doctorPayment.updateMany({
      where: { id: paymentId, status: "AKTIF" },
      data: {
        status: "IPTAL",
        cancelledAt: simdi(),
        cancelledBy: session.user.id,
        cancelReason: reason,
      },
    });
    if (res.count === 0) return false;
    const hareket = await tx.ledgerEntry.findFirst({
      where: { paymentId, type: "TAHSILAT" },
      select: { id: true },
    });
    if (hareket) await tersKayitYaz(tx, hareket.id, session.user.id);
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.COLLECTION_CANCEL,
        entityType: "DoctorPayment",
        entityId: paymentId,
        before,
        after: { status: "IPTAL", reason },
      },
      tx
    );
    return true;
  });
  if (!iptalEdildi) return engel("TAHSILAT_ZATEN_IPTAL");

  revalidatePath("/collections");
  revalidatePath("/doctors");
  return basarili();
}

/**
 * FR-22 / X-15 §(1): vade tarihi değiştirme. Vade CARİ HAREKETTEDİR (X-11 §(4));
 * yalnız `YONETICI`, gerekçe zorunlu, her değişiklik ize ve audit'e yazılır.
 * Vadede sistem sınırı YOKTUR (KARARLAR §2 madde 16).
 */
export async function changeDueDate(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();

  const ledgerEntryId = (formData.get("ledgerEntryId") as string)?.trim();
  const raw = (formData.get("newDueDate") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim();
  if (!ledgerEntryId) return engel("CARI_HAREKET_BULUNAMADI");
  if (!raw) return engel("ALAN_ZORUNLU", {}, "newDueDate");
  if (!reason) return engel("GEREKCE_ZORUNLU", {}, "reason");

  // `date` kolonu: "YYYY-MM-DD" UTC gece yarısı olarak okunur, dilim taşımaz (E-1 §(1)).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return engel("GECERSIZ_TARIH", {}, "newDueDate");
  const newDueDate = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(newDueDate.getTime())) return engel("GECERSIZ_TARIH", {}, "newDueDate");

  const entry = await prisma.ledgerEntry.findUnique({ where: { id: ledgerEntryId } });
  if (!entry) return engel("CARI_HAREKET_BULUNAMADI");
  if (entry.direction !== "BORC") return engel("VADE_YALNIZ_BORC");

  const oldDueDate = entry.dueDate;
  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.update({ where: { id: ledgerEntryId }, data: { dueDate: newDueDate } });
    await tx.dueDateChange.create({
      data: {
        ledgerEntryId,
        oldDueDate,
        newDueDate,
        changedBy: session.user.id,
        reason,
      },
    });
    // RULE-13: vade değişikliği istisnasız audit'e yazılır.
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.DUE_DATE_CHANGE,
        entityType: "LedgerEntry",
        entityId: ledgerEntryId,
        before: { dueDate: oldDueDate },
        after: { dueDate: newDueDate, reason },
      },
      tx
    );
  });

  revalidatePath("/doctors");
  return basarili();
}
