import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { gunAraligi } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `hesaplaStok()` — stok okumasının TEK yolu (B-4 · ADR-005). Inline `SUM` yasaktır.
 * Tek çağrı noktası listesinin 4. maddesi; bu, `CM` ilk sürümüdür (FAZ1 §D.1 not 3-c):
 * hareket toplamıdır. Ürün satırı kilidi ve `NEGATIF_STOK` izi 1B madde 1'dedir (R-10).
 *
 * `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır (E-1 §(5)).
 */
export async function hesaplaStok(
  urunId: string,
  konumId?: string,
  tarih?: Date,
  db: Db = prisma
): Promise<number> {
  const gruplar = await db.stockMovement.groupBy({
    by: ["type"],
    where: {
      productId: urunId,
      ...(konumId ? { locationId: konumId } : {}),
      ...(tarih ? { createdAt: { lt: gunAraligi(tarih).bitis } } : {}),
    },
    _sum: { quantity: true },
  });
  let stok = 0;
  for (const g of gruplar) {
    const miktar = g._sum.quantity ?? 0;
    stok += g.type === "GIRIS" ? miktar : -miktar;
  }
  return stok;
}

/**
 * Konum seçilmeyen akışların deposu. Faz 1'de tek depo seed edilir (B-4); çoklu
 * depoda UI davranışı satır sayısından türer ve konum seçimi 1B madde 7'dedir.
 */
export async function varsayilanDepoId(db: Db = prisma): Promise<string> {
  const depo = await db.stockLocation.findFirst({
    where: { type: "DEPO", isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!depo) throw new Error("Aktif depo tanımlı değil.");
  return depo.id;
}
