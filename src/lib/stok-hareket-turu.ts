/**
 * Stok hareketinin ekrandaki türü: her hareket bir belgeden doğar (B-7), tür o bağdan okunur
 * (spec Ü-19 §4.3). Ürün paneli ve stok ekranı ortak kullanır. Saf modül.
 */

export type HareketKaynagi = {
  type: "GIRIS" | "CIKIS";
  shipmentId: string | null;
  returnNoteId: string | null;
  consignmentIssueId: string | null;
  stockTransferId: string | null;
  stockAdjustmentId: string | null;
  importBatchId: string | null;
  /** 1B-7a öncesi akış stoğu sipariş anında düşürüyordu (eski kayıtlar). */
  orderId: string | null;
};

/** `hareketTuru()`'nun okuduğu alanlar (Prisma `select`). */
export const HAREKET_KAYNAGI = {
  type: true,
  shipmentId: true,
  returnNoteId: true,
  consignmentIssueId: true,
  stockTransferId: true,
  stockAdjustmentId: true,
  importBatchId: true,
  orderId: true,
} as const;

const ETIKETLER: readonly [Exclude<keyof HareketKaynagi, "type">, string][] = [
  ["shipmentId", "Sevkiyat"],
  ["returnNoteId", "İade"],
  ["consignmentIssueId", "Konsinye"],
  ["stockTransferId", "Transfer"],
  ["stockAdjustmentId", "Düzeltme"],
  ["importBatchId", "Açılış"],
  ["orderId", "Sipariş"],
];

export function hareketTuru(h: HareketKaynagi): string {
  const kaynak = ETIKETLER.find(([alan]) => h[alan] !== null);
  if (kaynak) return kaynak[1];
  return h.type === "GIRIS" ? "Stok girişi" : "Çıkış";
}
