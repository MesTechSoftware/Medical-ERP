import type { Prisma } from "@/generated/prisma/client";

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

export type HareketTuruKodu = "giris" | "sevkiyat" | "iade" | "konsinye" | "transfer" | "duzeltme" | "acilis" | "siparis";

type KaynakAlani = Exclude<keyof HareketKaynagi, "type">;

/** Kaynak alanları öncelik sırasıyla; bir hareketin türü dolu olan ilk alandır. */
const KAYNAKLAR: readonly [KaynakAlani, Exclude<HareketTuruKodu, "giris">, string][] = [
  ["shipmentId", "sevkiyat", "Sevkiyat"],
  ["returnNoteId", "iade", "İade"],
  ["consignmentIssueId", "konsinye", "Konsinye"],
  ["stockTransferId", "transfer", "Transfer"],
  ["stockAdjustmentId", "duzeltme", "Düzeltme"],
  ["importBatchId", "acilis", "Açılış"],
  ["orderId", "siparis", "Sipariş"],
];

/** Süzgeç seçenekleri; etiket ekrandaki tür etiketiyle aynıdır (B-4-10). */
export const HAREKET_TURLERI: readonly { kod: HareketTuruKodu; etiket: string }[] = [
  { kod: "giris", etiket: "Stok girişi" },
  ...KAYNAKLAR.map(([, kod, etiket]) => ({ kod, etiket })),
];

const kaynak = (h: HareketKaynagi) => KAYNAKLAR.find(([alan]) => h[alan] !== null);

export function hareketTuruKodu(h: HareketKaynagi): HareketTuruKodu {
  return kaynak(h)?.[1] ?? "giris";
}

export function hareketTuru(h: HareketKaynagi): string {
  return kaynak(h)?.[2] ?? (h.type === "GIRIS" ? "Stok girişi" : "Çıkış");
}

/**
 * Türün `where` koşulu: kendi alanı dolu, öncelikte ondan önceki alanların hepsi boş — `hareketTuruKodu`
 * ile aynı sınıflama, her hareket tam bir türe düşer. `giris`: bütün kaynak alanları boş.
 */
export function turKosulu(kod: HareketTuruKodu): Prisma.StockMovementWhereInput {
  const sira = KAYNAKLAR.findIndex(([, k]) => k === kod);
  const once = sira === -1 ? KAYNAKLAR : KAYNAKLAR.slice(0, sira);
  const kosul: Prisma.StockMovementWhereInput = Object.fromEntries(once.map(([alan]) => [alan, null]));
  return sira === -1 ? kosul : { ...kosul, [KAYNAKLAR[sira][0]]: { not: null } };
}
