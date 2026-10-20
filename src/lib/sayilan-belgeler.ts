import type { Prisma } from "@/generated/prisma/client";

/**
 * Sayılan belgeler filtresi — tek çağrı noktası listesinin 1. maddesi (FAZ1 §B.6).
 *
 * Ciro, prim, hakediş ve dışa aktarım sorguları "hangi belge sayılır?" sorusunu
 * yalnız buradan cevaplar; inline `where` yasaktır (A-5, K-4 §(2), X-1 §(5)).
 * Altı dışlama birlikte taşınır (KARARLAR §4 A-5 · B-7):
 *
 *   `TEKLIF`        → `siparis`       (A-5: teklif hiçbir hesaba girmez)
 *   `ACILIS`        → `cariHareket`   (A-6)
 *   `VADE_FARKI`    → `cariHareket`   (A-7)
 *   `KonsinyeCikis` → `stokHareketi`  (A-4: konsinye mal hâlâ bizimdir)
 *   `StokTransfer`  → `stokHareketi`
 *   `StokDuzeltme`  → `stokHareketi`  (B-7: mali sonucu yoktur)
 *   + bedelsiz satırlar → `sevkSatiri`, `iadeSatiri` (A-2)
 *   + `IPTAL` sipariş   → `siparis`   (X-6 §(9): iptalin matrahtan çıkması filtrenin işidir)
 *
 * İade satırı (A-1) ciro ve hakedişi iade tarihinde düşürür (A-1 eki 20.10.2026); sevk satırıyla
 * aynı sipariş ve bedelsiz dışlamasını taşır.
 *
 * Bakiye bu filtreyi KULLANMAZ: açılış ve vade farkı cari bakiyeye girer
 * (X-11 §(6)); filtre yalnız "satış sayılan" kümeleri tanımlar.
 */

const siparis = {
  stage: "ONAYLI",
  status: { not: "IPTAL" },
} satisfies Prisma.OrderWhereInput;

const sevkSatiri = {
  orderItem: { isFree: false },
  shipment: { order: siparis },
} satisfies Prisma.ShipmentItemWhereInput;

const iadeSatiri = {
  orderItem: { isFree: false, order: siparis },
} satisfies Prisma.ReturnNoteItemWhereInput;

const cariHareket = {
  type: { notIn: ["ACILIS", "VADE_FARKI"] },
} satisfies Prisma.LedgerEntryWhereInput;

const stokHareketi = {
  consignmentIssueId: null,
  stockTransferId: null,
  stockAdjustmentId: null,
} satisfies Prisma.StockMovementWhereInput;

export const sayilanBelgeler = Object.freeze({ siparis, sevkSatiri, iadeSatiri, cariHareket, stokHareketi });
