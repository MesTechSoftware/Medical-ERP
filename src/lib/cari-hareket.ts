import type Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import type { LedgerDirection } from "@/generated/prisma/enums";
import { uretBelgeNo } from "@/lib/belge-no";

/**
 * Cari hareketin TEK yazım yolu — X-11. Belge ve hareket aynı transaction'da yazılır (§(5));
 * tutar pozitiftir, yön ayrı taşınır (§(3), X-5 §(7)); tutar, yön ve tip sonradan değişmez —
 * düzeltme ters harekettir (§(5), §0.2). Bakiye bu satırların toplamıdır (`doctor-cari.ts`).
 */

type Tx = Prisma.TransactionClient;

/** `SEVKIYAT` · `BORC` — A-3: borç sevkiyatta doğar, vade sevk gününden işler (A-7). */
export function sevkiyatHareketiYaz(
  tx: Tx,
  g: { doctorId: string; tutar: Decimal; vade: Date; documentNo: string; shipmentId: string; yapanId: string }
) {
  return tx.ledgerEntry.create({
    data: {
      doctorId: g.doctorId,
      type: "SEVKIYAT",
      direction: "BORC",
      amount: g.tutar,
      dueDate: g.vade,
      documentNo: g.documentNo,
      shipmentId: g.shipmentId,
      createdById: g.yapanId,
    },
  });
}

/** `IADE` · `ALACAK` — A-1: iade edilen miktarın donmuş fiyatla tutarı; vade taşımaz (borç doğurmaz). */
export function iadeHareketiYaz(
  tx: Tx,
  g: { doctorId: string; tutar: Decimal; documentNo: string; returnNoteId: string; yapanId: string }
) {
  return tx.ledgerEntry.create({
    data: {
      doctorId: g.doctorId,
      type: "IADE",
      direction: "ALACAK",
      amount: g.tutar,
      documentNo: g.documentNo,
      returnNoteId: g.returnNoteId,
      createdById: g.yapanId,
    },
  });
}

/**
 * `VADE_FARKI` · `BORC` — A-7: yalnız elle girilir, otomatik hesaplanmaz. Kaynaksızdır; numarasını
 * kendisi alır (`VDF`, A-14 §(8)). Borç doğurduğu için vade taşır. KDV kırılımı yoktur (C-6 §(9)).
 */
export async function vadeFarkiYaz(
  tx: Tx,
  g: { doctorId: string; tutar: Decimal; vade: Date; yapanId: string }
) {
  const documentNo = await uretBelgeNo("VDF", tx);
  return tx.ledgerEntry.create({
    data: {
      doctorId: g.doctorId,
      type: "VADE_FARKI",
      direction: "BORC",
      amount: g.tutar,
      dueDate: g.vade,
      documentNo,
      createdById: g.yapanId,
    },
  });
}

/**
 * `ACILIS` — A-6: carinin tek açılış hareketi; iki yön de olabilir (avanslı açılış alacaktır). Kaynaksızdır,
 * numarasını kendisi alır (`ACL`, A-14 §(8)). Vade yalnız borçta (A-7, nullable). Yalnız içe aktarımla
 * yazılır (X-16 §(1)); düzeltmesi ters kayıttır (X-16 §(10)).
 */
export async function acilisHareketiYaz(
  tx: Tx,
  g: { doctorId: string; tutar: Decimal; yon: LedgerDirection; vade: Date | null; yapanId: string; partiId: string }
) {
  const documentNo = await uretBelgeNo("ACL", tx);
  return tx.ledgerEntry.create({
    data: {
      doctorId: g.doctorId,
      type: "ACILIS",
      direction: g.yon,
      amount: g.tutar,
      dueDate: g.vade,
      documentNo,
      importBatchId: g.partiId,
      createdById: g.yapanId,
    },
  });
}

/** `TAHSILAT` — A-11: yönü tahsilattan; tutar brüt tahsil edilen tutardır, komisyon cariye dokunmaz. */
export function tahsilatHareketiYaz(
  tx: Tx,
  g: { doctorId: string; tutar: Prisma.Decimal; yon: LedgerDirection; documentNo: string; paymentId: string; yapanId: string }
) {
  return tx.ledgerEntry.create({
    data: {
      doctorId: g.doctorId,
      type: "TAHSILAT",
      direction: g.yon,
      amount: g.tutar,
      documentNo: g.documentNo,
      paymentId: g.paymentId,
      createdById: g.yapanId,
    },
  });
}

/**
 * `TERS_KAYIT` — çevirdiği satırın tersi; o satıra bağ taşır, belge numarası kaynağınkidir.
 * Bir satır en fazla bir kez çevrilir (DB `UNIQUE`). Vade taşımaz (borç doğurmaz, borcu kapatır).
 */
export async function tersKayitYaz(tx: Tx, hareketId: string, yapanId: string) {
  const h = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: hareketId } });
  return tx.ledgerEntry.create({
    data: {
      doctorId: h.doctorId,
      type: "TERS_KAYIT",
      direction: h.direction === "BORC" ? "ALACAK" : "BORC",
      amount: h.amount,
      documentNo: h.documentNo,
      shipmentId: h.shipmentId,
      paymentId: h.paymentId,
      returnNoteId: h.returnNoteId,
      reversedEntryId: h.id,
      createdById: yapanId,
    },
  });
}
