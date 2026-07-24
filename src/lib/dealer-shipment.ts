import { prisma } from "@/lib/db";
import { lineTotals, sumLineTotals } from "@/lib/vat";

/**
 * Bayi sevkiyat kalemlerini bayinin FİYAT LİSTESİNDEN kurar.
 *
 * RULE-06: Fiyat listesinde tanımı olmayan ürün o bayiye sevk EDİLEMEZ.
 * Fiyat/KDV sevkiyat (ya da onay) anında snapshot'lanır (FR-41).
 *
 * Not: Stok burada KONTROL EDİLMEZ; stok düşümü onay anında ATOMİK yapılır
 * (AD-04, FR-42/FR-43). Burada yalnızca tutarlar hesaplanır.
 */

export type ShipmentLineInput = { productId: string; quantity: number };

export type BuiltItem = {
  productId: string;
  quantity: number;
  netUnitPrice: bigint;
  vatRate: number;
  vatAmount: bigint;
  lineNetTotal: bigint;
  lineGrossTotal: bigint;
};

export type BuiltShipment = {
  items: BuiltItem[];
  netTotal: bigint;
  vatTotal: bigint;
  grossTotal: bigint;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma;

export async function buildShipment(
  dealerId: string,
  lines: readonly ShipmentLineInput[],
  tx: Tx = prisma
): Promise<BuiltShipment> {
  if (lines.length === 0) throw new Error("En az bir kalem giriniz.");

  const prices = await tx.dealerPrice.findMany({
    where: { dealerId, productId: { in: lines.map((l) => l.productId) } },
    include: { product: { select: { name: true, status: true } } },
  });
  const priceByProduct = new Map(prices.map((p) => [p.productId, p]));

  const items: BuiltItem[] = [];
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Geçersiz miktar.");
    }
    const price = priceByProduct.get(line.productId);
    // RULE-06: fiyatı tanımlanmamış ürün sevk edilemez.
    if (!price) {
      throw new Error(
        "Bu bayi için fiyatı tanımlanmamış bir ürün sevk edilemez."
      );
    }
    if (price.product.status !== "ACTIVE") {
      throw new Error(`${price.product.name} pasif durumda.`);
    }

    const totals = lineTotals(price.netPrice, line.quantity, price.vatRate);
    items.push({
      productId: line.productId,
      quantity: line.quantity,
      netUnitPrice: price.netPrice,
      vatRate: price.vatRate,
      ...totals,
    });
  }

  return { items, ...sumLineTotals(items) };
}
